package main

import (
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
	roomID := r.URL.Query().Get("roomID")
	playerID := r.URL.Query().Get("playerID")
	player := &game.Player{ID: playerID}
	room, success := game.JoinRoom(roomID, player)
	if success {
		w.Write([]byte("Joined room: " + room.ID))
	} else {
		http.Error(w, "Room not found", http.StatusNotFound)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	// Extract roomID and playerID from query parameters
	roomID := r.URL.Query().Get("roomID")
	playerID := r.URL.Query().Get("playerID")

	if roomID == "" {
		log.Println("Room ID is missing")
		http.Error(w, "Room ID is required", http.StatusBadRequest)
		return
	}

	// Find the room and player
	room, exists := game.GetRoom(roomID)
	if !exists {
		log.Println("Room not found:", roomID)
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	player := &game.Player{ID: playerID, Conn: conn}
	room.Players = append(room.Players, player)

	// Start the game if all players are ready
	if len(room.Players) == 2 { // Example: start when 2 players are in the room
		room.Game.Start()
	}

	// Handle game updates and player inputs
	go func() {
		for update := range room.Game.Updates {
			for _, p := range room.Players {
				if p.Conn == nil {
					log.Println("Player connection is nil")
					continue
				}
				if err := p.Conn.WriteMessage(websocket.TextMessage, update); err != nil {
					log.Println(err)
					return
				}
			}
		}
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			break
		}
		command := string(message)
		room.Game.HandleInput(command)
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
