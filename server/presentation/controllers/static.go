package controllers

import (
	"net/http"
)

type StaticController struct {
	BaseController
}

func MakeStaticController() *StaticController {
	controller := &StaticController{}
	controller.Route("GET", `.*`, serveStatic)
	return controller
}

func serveStatic(w http.ResponseWriter, r *http.Request) {
	http.FileServer(http.Dir("dist/public")).ServeHTTP(w, r)
}
