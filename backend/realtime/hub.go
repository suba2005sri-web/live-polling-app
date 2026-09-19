package realtime

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*websocket.Conn]struct{}
}

func NewHub() *Hub { return &Hub{clients: make(map[string]map[*websocket.Conn]struct{})} }

func (h *Hub) Add(pollID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[pollID] == nil {
		h.clients[pollID] = make(map[*websocket.Conn]struct{})
	}
	h.clients[pollID][conn] = struct{}{}
}

func (h *Hub) Remove(pollID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if subscribers := h.clients[pollID]; subscribers != nil {
		delete(subscribers, conn)
		if len(subscribers) == 0 {
			delete(h.clients, pollID)
		}
	}
}

func (h *Hub) Broadcast(pollID string, payload any) {
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	h.mu.RLock()
	subscribers := make([]*websocket.Conn, 0, len(h.clients[pollID]))
	for conn := range h.clients[pollID] {
		subscribers = append(subscribers, conn)
	}
	h.mu.RUnlock()
	for _, conn := range subscribers {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			_ = conn.Close()
			h.Remove(pollID, conn)
		}
	}
}
