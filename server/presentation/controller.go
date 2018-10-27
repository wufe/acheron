package presentation

import (
	"net/http"
)

type Action interface {
	GetMethod() string
	GetRe() string
	Handle(w http.ResponseWriter, r *http.Request)
}

type Controller interface {
	GetActions() []Action
}
