package game

import (
	"github.com/gorilla/websocket"
	"sync"
)

type Player struct {
	ID   string
	Conn *websocket.Conn
	Mu   sync.Mutex
}