package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/kontentski/tetris/game"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func createRoomHandler(w http.ResponseWriter, r *http.Request) {
	room := game.CreateRoom()
	w.Write([]byte(room.ID))
}

func joinRoomHandler(w http.ResponseWriter, r *http.Request) {
	// Set proper headers
	w.Header().Set("Content-Type", "application/json")

	roomID := r.URL.Query().Get("roomID")
	playerID := game.GenerateID()
	player := &game.Player{ID: playerID}
	
	room, success := game.JoinRoom(roomID, player)
	if success {
		response := map[string]string{
			"message":  "Joined room: " + room.ID,
			"playerID": playerID,
		}
		jsonResponse, err := json.Marshal(response)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		w.Write(jsonResponse)
	} else {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Room not found",
		})
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	roomID := r.URL.Query().Get("roomID")
	playerID := r.URL.Query().Get("playerID")

	log.Printf("WebSocket connection attempt - Room: %s, Player: %s", roomID, playerID)

	room, exists := game.GetRoom(roomID)
	if !exists {
		log.Printf("Room not found: %s", roomID)
		return
	}

	var player *game.Player
	for _, p := range room.Players {
		if p != nil && p.ID == playerID {
			player = p
			break
		}
	}

	if player == nil {
		log.Printf("Player %s not found in room %s", playerID, roomID)
		return
	}

	player.SetConnection(conn)
	log.Printf("Player %s connected successfully to room %s", playerID, roomID)

	// Check and start the game if both players are connected
	room.Game.CheckAndStartGame()

	// Create a done channel for cleanup
	done := make(chan struct{})
	defer close(done)

	// Handle incoming messages
	go func() {
		for {
			select {
			case <-done:
				return
			default:
				_, message, err := conn.ReadMessage()
				if err != nil {
					log.Printf("Read error: %v", err)
					return
				}
				command := string(message)
				room.Game.HandleInput(playerID, command)
			}
		}
	}()

	// Handle game updates
	for update := range room.Game.Updates {
		room.Game.BroadcastUpdate(update)
	}
}

func main() {
	http.HandleFunc("/create-room", createRoomHandler)
	http.HandleFunc("/join-room", joinRoomHandler)
	http.HandleFunc("/ws", handleWebSocket)
	http.Handle("/", http.FileServer(http.Dir("static")))

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
