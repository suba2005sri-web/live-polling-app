package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/crypto/bcrypt"

	"poll-backend/config"
	"poll-backend/realtime"
)

type Option struct {
	ID    string `json:"id" bson:"id"`
	Text  string `json:"text" bson:"text"`
	Votes int64  `json:"votes" bson:"votes"`
}
type Poll struct {
	ID              string     `json:"id" bson:"_id"`
	OwnerID         string     `json:"ownerId" bson:"ownerId"`
	Question        string     `json:"question" bson:"question"`
	Options         []Option   `json:"options" bson:"options"`
	TotalVotes      int64      `json:"totalVotes" bson:"totalVotes"`
	Status          string     `json:"status" bson:"status"`
	AllowComments   bool       `json:"allowComments" bson:"allowComments"`
	EnableReactions bool       `json:"enableReactions" bson:"enableReactions"`
	ExpiresAt       *time.Time `json:"expiresAt,omitempty" bson:"expiresAt,omitempty"`
	CreatedAt       time.Time  `json:"createdAt" bson:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt" bson:"updatedAt"`
}
type User struct {
	ID           string    `json:"id" bson:"_id"`
	Name         string    `json:"name" bson:"name"`
	Email        string    `json:"email" bson:"email"`
	PasswordHash string    `json:"-" bson:"passwordHash"`
	GoogleSub    string    `json:"-" bson:"googleSub,omitempty"`
	CreatedAt    time.Time `json:"createdAt" bson:"createdAt"`
}
type Vote struct {
	ID        string    `bson:"_id"`
	PollID    string    `bson:"pollId"`
	OptionID  string    `bson:"optionId"`
	VoterKey  string    `bson:"voterKey"`
	CreatedAt time.Time `bson:"createdAt"`
}
type Comment struct {
	ID        string    `json:"id" bson:"_id"`
	PollID    string    `json:"pollId" bson:"pollId"`
	UserID    string    `json:"userId,omitempty" bson:"userId,omitempty"`
	Author    string    `json:"author" bson:"author"`
	Text      string    `json:"text" bson:"text"`
	CreatedAt time.Time `json:"createdAt" bson:"createdAt"`
}
type App struct {
	cfg        config.Config
	mongo      *mongo.Client
	db         *mongo.Database
	redis      *redis.Client
	redisReady bool
	hub        *realtime.Hub
}
type claims struct {
	UserID string `json:"uid"`
	jwt.RegisteredClaims
}

func main() {
	loadEnvFile()
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Configuration error: %v", err)
	}
	client, err := config.ConnectMongoDB(cfg.MongoURI)
	if err != nil {
		log.Fatalf("MongoDB connection failed: %v", err)
	}
	fmt.Println("MongoDB connected successfully")
	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()
	var rdb *redis.Client
	redisReady := false
	if cfg.RedisURL == "" {
		log.Println("Redis is disabled: REDIS_URL is not configured")
	} else {
		redisOptions, parseErr := redis.ParseURL(cfg.RedisURL)
		if parseErr != nil {
			log.Printf("Redis is disabled: invalid REDIS_URL: %v", parseErr)
		} else {
			rdb = redis.NewClient(redisOptions)
			if pingErr := rdb.Ping(ctx).Err(); pingErr != nil {
				log.Printf("Redis is unavailable; continuing without Redis: %v", pingErr)
				_ = rdb.Close()
				rdb = nil
			} else {
				redisReady = true
				fmt.Println("Redis connected successfully")
			}
		}
	}
	app := &App{cfg: cfg, mongo: client, db: client.Database(cfg.MongoDatabase), redis: rdb, redisReady: redisReady, hub: realtime.NewHub()}
	app.ensureIndexes(ctx)
	if app.redisReady {
		go app.redisSubscriber()
	}
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			origin = cfg.FrontendURL
		}
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})
	routes := r.Group("/api")
	app.routes(routes)
	server := &http.Server{Addr: "0.0.0.0:" + cfg.Port, Handler: r}
	go func() {
		fmt.Printf("Backend running on http://0.0.0.0:%s\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Backend server failed: %v", err)
		}
	}()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	_ = server.Shutdown(shutdownCtx)
	if rdb != nil {
		_ = rdb.Close()
	}
	_ = client.Disconnect(shutdownCtx)
}

func loadEnvFile() {
	candidates := []string{".env"}
	if executable, err := os.Executable(); err == nil {
		root := filepath.Dir(executable)
		candidates = append(candidates, filepath.Join(root, ".env"))
	}
	candidates = append(candidates, ".env.txt")
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			if err := godotenv.Load(candidate); err != nil {
				log.Fatalf("Environment file error (%s): %v", candidate, err)
			}
			return
		}
	}
}

func (a *App) routes(r *gin.RouterGroup) {
	r.GET("/health", func(c *gin.Context) {
		checkCtx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()
		mongoStatus := "connected"
		redisStatus := "disabled"
		if err := a.mongo.Ping(checkCtx, nil); err != nil {
			mongoStatus = "disconnected"
		}
		if a.redisReady {
			redisStatus = "connected"
			if err := a.redis.Ping(checkCtx).Err(); err != nil {
				redisStatus = "disconnected"
			}
		}
		status := http.StatusOK
		message := "Backend and MongoDB are running; Redis is disabled"
		if redisStatus == "connected" {
			message = "Backend, MongoDB and Redis are running"
		}
		if mongoStatus != "connected" || redisStatus == "disconnected" {
			status = http.StatusServiceUnavailable
			message = "One or more backend dependencies are unavailable"
		}
		c.JSON(status, gin.H{"status": map[bool]string{true: "ok", false: "degraded"}[status == http.StatusOK], "message": message, "mongodb": mongoStatus, "redis": redisStatus})
	})
	r.POST("/auth/signup", a.signup)
	r.POST("/auth/login", a.login)
	r.POST("/auth/google", a.googleLogin)
	auth := r.Group("")
	auth.Use(a.requireAuth)
	auth.GET("/my-polls", a.listPolls)
	auth.POST("/polls", a.createPoll)
	auth.PUT("/polls/:id", a.updatePoll)
	auth.DELETE("/polls/:id", a.deletePoll)
	r.GET("/polls/:id", a.getPoll)
	r.GET("/polls/:id/results", a.getPoll)
	r.POST("/polls/:id/vote", a.vote)
	r.GET("/polls/:id/comments", a.listComments)
	r.POST("/polls/:id/comments", a.createComment)
	r.GET("/polls/:id/reactions", a.reactions)
	r.POST("/polls/:id/reactions", a.addReaction)
	r.DELETE("/comments/:id", a.deleteComment)
	r.GET("/ws/polls/:id", a.websocket)
}

func (a *App) ensureIndexes(ctx context.Context) {
	_, _ = a.db.Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "email", Value: 1}}, Options: options.Index().SetUnique(true)})
	_, _ = a.db.Collection("votes").Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "pollId", Value: 1}, {Key: "voterKey", Value: 1}}, Options: options.Index().SetUnique(true)})
	_, _ = a.db.Collection("polls").Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "ownerId", Value: 1}}})
	_, _ = a.db.Collection("comments").Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "pollId", Value: 1}}})
}
func id() string           { b := make([]byte, 12); _, _ = rand.Read(b); return hex.EncodeToString(b) }
func hash(v string) string { b := sha256.Sum256([]byte(v)); return hex.EncodeToString(b[:]) }
func (a *App) token(userID string) (string, error) {
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims{UserID: userID, RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour))}}).SignedString([]byte(a.cfg.JWTSecret))
}
func (a *App) requireAuth(c *gin.Context) {
	raw := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
	token, err := jwt.ParseWithClaims(raw, &claims{}, func(t *jwt.Token) (any, error) { return []byte(a.cfg.JWTSecret), nil })
	if err != nil || !token.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}
	cl, ok := token.Claims.(*claims)
	if !ok {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	c.Set("userID", cl.UserID)
	c.Next()
}
func userID(c *gin.Context) string { v, _ := c.Get("userID"); return fmt.Sprint(v) }
func (a *App) signup(c *gin.Context) {
	var in struct{ Name, Email, Password string }
	if c.ShouldBindJSON(&in) != nil || len(strings.TrimSpace(in.Name)) < 2 || !strings.Contains(in.Email, "@") || len(in.Password) < 8 {
		c.JSON(400, gin.H{"message": "Name, valid email, and password of at least 8 characters are required"})
		return
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if n, _ := a.db.Collection("users").CountDocuments(c, bson.M{"email": email}); n > 0 {
		c.JSON(409, gin.H{"message": "An account with that email already exists"})
		return
	}
	pass, _ := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	u := User{ID: id(), Name: strings.TrimSpace(in.Name), Email: email, PasswordHash: string(pass), CreatedAt: time.Now()}
	if _, err := a.db.Collection("users").InsertOne(c, u); err != nil {
		c.JSON(500, gin.H{"message": "Unable to create account"})
		return
	}
	a.respondAuth(c, u)
}
func (a *App) login(c *gin.Context) {
	var in struct{ Email, Password string }
	if c.ShouldBindJSON(&in) != nil {
		c.JSON(400, gin.H{"message": "Invalid request"})
		return
	}
	var u User
	if err := a.db.Collection("users").FindOne(c, bson.M{"email": strings.ToLower(strings.TrimSpace(in.Email))}).Decode(&u); err != nil || bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(in.Password)) != nil {
		c.JSON(401, gin.H{"message": "Invalid email or password"})
		return
	}
	a.respondAuth(c, u)
}
func (a *App) respondAuth(c *gin.Context, u User) {
	t, err := a.token(u.ID)
	if err != nil {
		c.JSON(500, gin.H{"message": "Unable to create session"})
		return
	}
	c.JSON(200, gin.H{"success": true, "token": t, "user": u})
}
func (a *App) googleLogin(c *gin.Context) {
	var in struct {
		Credential string `json:"credential"`
	}
	if c.ShouldBindJSON(&in) != nil || in.Credential == "" {
		c.JSON(400, gin.H{"message": "Google credential is required"})
		return
	}
	req, _ := http.NewRequestWithContext(c, http.MethodGet, "https://oauth2.googleapis.com/tokeninfo?id_token="+url.QueryEscape(in.Credential), nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode != 200 {
		c.JSON(401, gin.H{"message": "Google credential could not be verified"})
		return
	}
	defer resp.Body.Close()
	var g struct{ Sub, Email, Name string }
	if json.NewDecoder(resp.Body).Decode(&g) != nil || g.Email == "" {
		c.JSON(401, gin.H{"message": "Invalid Google credential"})
		return
	}
	var u User
	err = a.db.Collection("users").FindOne(c, bson.M{"email": strings.ToLower(g.Email)}).Decode(&u)
	if errors.Is(err, mongo.ErrNoDocuments) {
		u = User{ID: id(), Name: g.Name, Email: strings.ToLower(g.Email), GoogleSub: g.Sub, CreatedAt: time.Now()}
		_, err = a.db.Collection("users").InsertOne(c, u)
	}
	if err != nil {
		c.JSON(500, gin.H{"message": "Unable to sign in with Google"})
		return
	}
	a.respondAuth(c, u)
}
func (a *App) createPoll(c *gin.Context) {
	var in struct {
		Question        string     `json:"question"`
		Options         []string   `json:"options"`
		AllowComments   bool       `json:"allowComments"`
		EnableReactions bool       `json:"enableReactions"`
		ExpiresAt       *time.Time `json:"expiresAt"`
	}
	if c.ShouldBindJSON(&in) != nil || len(strings.TrimSpace(in.Question)) < 5 || len(in.Options) < 2 || len(in.Options) > 8 {
		c.JSON(400, gin.H{"message": "Question and 2 to 8 options are required"})
		return
	}
	seen := map[string]bool{}
	opts := make([]Option, 0, len(in.Options))
	for _, v := range in.Options {
		s := strings.TrimSpace(v)
		if s == "" || seen[strings.ToLower(s)] {
			c.JSON(400, gin.H{"message": "Options must be unique and non-empty"})
			return
		}
		seen[strings.ToLower(s)] = true
		opts = append(opts, Option{ID: id(), Text: s})
	}
	now := time.Now()
	p := Poll{ID: id(), OwnerID: userID(c), Question: strings.TrimSpace(in.Question), Options: opts, Status: "active", AllowComments: in.AllowComments, EnableReactions: in.EnableReactions, ExpiresAt: in.ExpiresAt, CreatedAt: now, UpdatedAt: now}
	if _, err := a.db.Collection("polls").InsertOne(c, p); err != nil {
		c.JSON(500, gin.H{"message": "Unable to create poll"})
		return
	}
	c.JSON(201, p)
}
func (a *App) listPolls(c *gin.Context) {
	cur, err := a.db.Collection("polls").Find(c, bson.M{"ownerId": userID(c)}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		c.JSON(500, gin.H{"message": "Unable to load polls"})
		return
	}
	defer cur.Close(c)
	var polls []Poll
	if err = cur.All(c, &polls); err != nil {
		c.JSON(500, gin.H{"message": "Unable to load polls"})
		return
	}
	if polls == nil {
		polls = []Poll{}
	}
	c.JSON(200, polls)
}
func (a *App) findPoll(c *gin.Context) (Poll, error) {
	var p Poll
	err := a.db.Collection("polls").FindOne(c, bson.M{"_id": c.Param("id")}).Decode(&p)
	return p, err
}
func (a *App) getPoll(c *gin.Context) {
	p, err := a.findPoll(c)
	if err != nil {
		c.JSON(404, gin.H{"message": "Poll not found"})
		return
	}
	if p.ExpiresAt != nil && p.ExpiresAt.Before(time.Now()) && p.Status == "active" {
		p.Status = "closed"
	}
	a.syncResults(c, p)
	c.JSON(200, p)
}

func (a *App) syncResults(ctx context.Context, p Poll) {
	if !a.redisReady {
		return
	}
	values := make(map[string]any, len(p.Options))
	for _, option := range p.Options {
		values[option.ID] = option.Votes
	}
	if len(values) > 0 {
		_ = a.redis.HSet(ctx, "poll:"+p.ID+":results", values).Err()
	}
}
func (a *App) updatePoll(c *gin.Context) {
	p, err := a.findPoll(c)
	if err != nil || p.OwnerID != userID(c) {
		c.JSON(404, gin.H{"message": "Poll not found"})
		return
	}
	var in struct {
		Question string `json:"question"`
		Status   string `json:"status"`
	}
	if c.ShouldBindJSON(&in) != nil {
		c.JSON(400, gin.H{"message": "Invalid request"})
		return
	}
	set := bson.M{"updatedAt": time.Now()}
	if strings.TrimSpace(in.Question) != "" {
		set["question"] = strings.TrimSpace(in.Question)
	}
	if in.Status == "active" || in.Status == "closed" {
		set["status"] = in.Status
	}
	_, err = a.db.Collection("polls").UpdateOne(c, bson.M{"_id": p.ID}, bson.M{"$set": set})
	if err != nil {
		c.JSON(500, gin.H{"message": "Unable to update poll"})
		return
	}
	a.getPoll(c)
}
func (a *App) deletePoll(c *gin.Context) {
	p, err := a.findPoll(c)
	if err != nil || p.OwnerID != userID(c) {
		c.JSON(404, gin.H{"message": "Poll not found"})
		return
	}
	_, _ = a.db.Collection("polls").DeleteOne(c, bson.M{"_id": p.ID})
	_, _ = a.db.Collection("votes").DeleteMany(c, bson.M{"pollId": p.ID})
	_, _ = a.db.Collection("comments").DeleteMany(c, bson.M{"pollId": p.ID})
	if a.redisReady {
		_ = a.redis.Del(c, "poll:"+p.ID+":results").Err()
	}
	c.JSON(200, gin.H{"success": true})
}
func (a *App) vote(c *gin.Context) {
	var in struct {
		OptionID string `json:"optionId"`
	}
	if c.ShouldBindJSON(&in) != nil || in.OptionID == "" {
		c.JSON(400, gin.H{"message": "Option is required"})
		return
	}
	p, err := a.findPoll(c)
	if err != nil {
		c.JSON(404, gin.H{"message": "Poll not found"})
		return
	}
	if p.Status != "active" || (p.ExpiresAt != nil && p.ExpiresAt.Before(time.Now())) {
		c.JSON(400, gin.H{"message": "This poll is closed"})
		return
	}
	valid := false
	for _, o := range p.Options {
		if o.ID == in.OptionID {
			valid = true
		}
	}
	if !valid {
		c.JSON(400, gin.H{"message": "Invalid option"})
		return
	}
	voter := hash(c.ClientIP() + c.GetHeader("User-Agent") + p.ID)
	v := Vote{ID: id(), PollID: p.ID, OptionID: in.OptionID, VoterKey: voter, CreatedAt: time.Now()}
	if _, err = a.db.Collection("votes").InsertOne(c, v); err != nil {
		if mongo.IsDuplicateKeyError(err) {
			c.JSON(409, gin.H{"message": "You have already voted on this poll"})
		} else {
			c.JSON(500, gin.H{"message": "Unable to record vote"})
		}
		return
	}
	count := int64(0)
	if a.redisReady {
		key := "poll:" + p.ID + ":results"
		count, err = a.redis.HIncrBy(c, key, in.OptionID, 1).Result()
		if err != nil {
			count = 0
		}
	}
	p.TotalVotes++
	for i := range p.Options {
		if p.Options[i].ID == in.OptionID {
			p.Options[i].Votes = count
		}
	}
	_, _ = a.db.Collection("polls").UpdateOne(c, bson.M{"_id": p.ID}, bson.M{"$set": bson.M{"totalVotes": p.TotalVotes, "options": p.Options, "updatedAt": time.Now()}})
	a.publish(p)
	c.JSON(201, gin.H{"success": true, "message": "Vote registered successfully", "poll": p})
}
func (a *App) publish(p Poll) {
	if !a.redisReady {
		return
	}
	payload := gin.H{"pollId": p.ID, "results": map[string]int64{}, "totalVotes": p.TotalVotes}
	r := payload["results"].(map[string]int64)
	for _, o := range p.Options {
		r[o.ID] = o.Votes
	}
	b, _ := json.Marshal(payload)
	_ = a.redis.Publish(context.Background(), "poll:"+p.ID+":updates", b).Err()
}
func (a *App) redisSubscriber() {
	if !a.redisReady {
		return
	}
	ctx := context.Background()
	sub := a.redis.PSubscribe(ctx, "poll:*:updates")
	ch := sub.Channel()
	for msg := range ch {
		parts := strings.Split(msg.Channel, ":")
		if len(parts) == 3 {
			var payload any
			if json.Unmarshal([]byte(msg.Payload), &payload) == nil {
				a.hub.Broadcast(parts[1], payload)
			}
		}
	}
}
func (a *App) commentsEnabled(c *gin.Context) (Poll, bool) {
	p, e := a.findPoll(c)
	return p, e == nil && p.AllowComments
}
func (a *App) listComments(c *gin.Context) {
	p, ok := a.commentsEnabled(c)
	if !ok {
		c.JSON(403, gin.H{"message": "Comments are disabled"})
		return
	}
	cur, e := a.db.Collection("comments").Find(c, bson.M{"pollId": p.ID}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: 1}}))
	if e != nil {
		c.JSON(500, gin.H{"message": "Unable to load comments"})
		return
	}
	defer cur.Close(c)
	var out []Comment
	_ = cur.All(c, &out)
	if out == nil {
		out = []Comment{}
	}
	c.JSON(200, out)
}
func (a *App) createComment(c *gin.Context) {
	p, ok := a.commentsEnabled(c)
	if !ok {
		c.JSON(403, gin.H{"message": "Comments are disabled"})
		return
	}
	var in struct {
		Text string `json:"text"`
	}
	if c.ShouldBindJSON(&in) != nil || len(strings.TrimSpace(in.Text)) < 1 || len(in.Text) > 500 {
		c.JSON(400, gin.H{"message": "Comment must be between 1 and 500 characters"})
		return
	}
	author := "Anonymous"
	uid := userID(c)
	if uid != "<nil>" {
		var u User
		if a.db.Collection("users").FindOne(c, bson.M{"_id": uid}).Decode(&u) == nil {
			author = u.Name
		}
	}
	comment := Comment{ID: id(), PollID: p.ID, UserID: uid, Author: author, Text: strings.TrimSpace(in.Text), CreatedAt: time.Now()}
	if _, e := a.db.Collection("comments").InsertOne(c, comment); e != nil {
		c.JSON(500, gin.H{"message": "Unable to add comment"})
		return
	}
	c.JSON(201, comment)
}
func (a *App) deleteComment(c *gin.Context) {
	var item Comment
	if a.db.Collection("comments").FindOne(c, bson.M{"_id": c.Param("id")}).Decode(&item) != nil || item.UserID != userID(c) {
		c.JSON(404, gin.H{"message": "Comment not found"})
		return
	}
	_, _ = a.db.Collection("comments").DeleteOne(c, bson.M{"_id": item.ID})
	c.JSON(200, gin.H{"success": true})
}
func (a *App) reactions(c *gin.Context) {
	if !a.redisReady {
		c.JSON(200, gin.H{})
		return
	}
	pollID := c.Param("id")
	values, e := a.redis.HGetAll(c, "poll:"+pollID+":reactions").Result()
	if e != nil {
		c.JSON(500, gin.H{"message": "Unable to load reactions"})
		return
	}
	c.JSON(200, values)
}
func (a *App) addReaction(c *gin.Context) {
	if !a.redisReady {
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "Reactions are temporarily unavailable because Redis is not connected"})
		return
	}
	var in struct {
		Reaction string `json:"reaction"`
	}
	if c.ShouldBindJSON(&in) != nil || !strings.Contains("❤️👍😂🔥😮👏", in.Reaction) {
		c.JSON(400, gin.H{"message": "Unsupported reaction"})
		return
	}
	p, e := a.findPoll(c)
	if e != nil {
		c.JSON(404, gin.H{"message": "Poll not found"})
		return
	}
	key := "poll:" + p.ID + ":reactions"
	n, _ := a.redis.HIncrBy(c, key, in.Reaction, 1).Result()
	payload := gin.H{"pollId": p.ID, "reaction": in.Reaction, "count": n}
	b, _ := json.Marshal(payload)
	_ = a.redis.Publish(c, "poll:"+p.ID+":updates", b).Err()
	c.JSON(201, payload)
}
func (a *App) websocket(c *gin.Context) {
	upgrader := websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	conn, e := upgrader.Upgrade(c.Writer, c.Request, nil)
	if e != nil {
		return
	}
	pollID := c.Param("id")
	a.hub.Add(pollID, conn)
	defer a.hub.Remove(pollID, conn)
	defer conn.Close()
	for {
		if _, _, e = conn.ReadMessage(); e != nil {
			return
		}
	}
}
