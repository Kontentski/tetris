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

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	g := game.NewGame()
	g.Start()

	// Send game updates to client
	go func() {
		for update := range g.Updates {
			if err := conn.WriteMessage(websocket.TextMessage, update); err != nil {
				log.Println(err)
				return
			}
		}
	}()

	// Handle client messages
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			break
		}
		command := string(message)
		g.HandleInput(command)
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	http.Handle("/", http.FileServer(http.Dir("static")))
	
	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
} 