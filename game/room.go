package game

import (
	"math/rand"
	"time"
)

type Room struct {
	ID      string
	Players []*Player
	Game    *Game
}

var rooms = make(map[string]*Room)

// CreateRoom creates a new room and returns it
func CreateRoom() *Room {
	roomID := GenerateID()
	room := &Room{
		ID:      roomID,
		Players: []*Player{},
		Game:    NewGame(),
	}
	rooms[roomID] = room
	return room
}

func GenerateID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 6

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	b := make([]byte, length)
	for i := range b {
		b[i] = charset[r.Intn(len(charset))]
	}
	return string(b)
}

// JoinRoom adds a player to a room if it exists
func JoinRoom(roomID string, player *Player) (*Room, bool) {
	room, exists := rooms[roomID]
	if !exists {
		return nil, false
	}
	room.Players = append(room.Players, player)
	room.Game.Players = append(room.Game.Players, player)
	return room, true
}

// GetRoom retrieves a room by its ID
func GetRoom(roomID string) (*Room, bool) {
	room, exists := rooms[roomID]
	return room, exists
} 