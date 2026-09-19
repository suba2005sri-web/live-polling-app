package config

import (
	"fmt"
	"net/url"
	"os"
	"strings"
)

type Config struct {
	Port           string
	MongoURI       string
	MongoDatabase  string
	RedisURL       string
	JWTSecret      string
	FrontendURL    string
	GoogleClientID string
}

func Load() (Config, error) {
	cfg := Config{
		Port:           value("PORT", "8080"),
		MongoURI:       value("MONGODB_URI", ""),
		MongoDatabase:  value("MONGODB_DATABASE", "live_polling"),
		RedisURL:       value("REDIS_URL", "redis://localhost:6379/0"),
		JWTSecret:      value("JWT_SECRET", "change-this-development-secret"),
		FrontendURL:    value("FRONTEND_URL", "http://localhost:5173"),
		GoogleClientID: strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID")),
	}

	cfg.MongoURI = strings.Trim(strings.TrimSpace(cfg.MongoURI), `"'`)
	if cfg.MongoURI == "" {
		return Config{}, fmt.Errorf("MONGODB_URI is not configured")
	}
	if strings.Contains(cfg.MongoURI, "<db_password>") || strings.Contains(cfg.MongoURI, "<url_encoded_db_password>") || strings.Contains(strings.ToLower(cfg.MongoURI), "your_mongodb_connection_string") {
		return Config{}, fmt.Errorf("MONGODB_URI contains placeholder credentials")
	}
	parsedMongo, err := url.Parse(cfg.MongoURI)
	if err != nil || parsedMongo.Scheme != "mongodb+srv" || parsedMongo.Host == "" {
		return Config{}, fmt.Errorf("invalid MONGODB_URI: use a MongoDB Atlas URI starting with mongodb+srv://")
	}
	if parsedMongo.User != nil {
		if _, ok := parsedMongo.User.Password(); !ok {
			return Config{}, fmt.Errorf("invalid MONGODB_URI: database password is missing")
		}
	}
	if strings.TrimSpace(cfg.MongoDatabase) == "" {
		return Config{}, fmt.Errorf("MONGODB_DATABASE is not configured")
	}
	if cfg.RedisURL == "" {
		return Config{}, fmt.Errorf("REDIS_URL is not configured")
	}
	if strings.TrimSpace(cfg.JWTSecret) == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is not configured")
	}
	if _, err := url.ParseRequestURI(cfg.RedisURL); err != nil {
		return Config{}, fmt.Errorf("invalid REDIS_URL: %w", err)
	}
	return cfg, nil
}

func value(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}

	return fallback
}
