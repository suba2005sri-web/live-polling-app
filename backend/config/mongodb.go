package config

import (
	"context"
	"crypto/tls"
	"fmt"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func ConnectMongoDB(uri string) (*mongo.Client, error) {
	uri = strings.Trim(strings.TrimSpace(uri), `"'`)
	if uri == "" {
		return nil, fmt.Errorf("MONGODB_URI is not set")
	}

	client, err := mongo.Connect(
		options.Client().
			ApplyURI(uri).
			SetTLSConfig(&tls.Config{MinVersion: tls.VersionTLS12}).
			SetConnectTimeout(15 * time.Second).
			SetServerSelectionTimeout(20 * time.Second),
	)

	if err != nil {
		return nil, fmt.Errorf("create MongoDB client: %w", err)
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		25*time.Second,
	)
	defer cancel()

	if err := client.Ping(ctx, nil); err != nil {
		_ = client.Disconnect(context.Background())
		return nil, fmt.Errorf("ping MongoDB: %w; verify Atlas Network Access, cluster state, credentials, and local network access to port 27017", err)
	}

	return client, nil
}
