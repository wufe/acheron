package main

import (
	"runtime"

	_ "github.com/joho/godotenv/autoload"
	"github.com/wufe/acheron/server"
)

const timeFormat = "2006-01-02 15:04 MST"

func main() {
	runtime.GOMAXPROCS(99)

	webServer := make(chan struct{})

	go func() {
		server.Start(999)
	}()

	<-webServer
}
