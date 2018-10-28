package controllers

import (
	"net/http"
)

type TestController struct {
	BaseController
}

func MakeTestController() *TestController {
	controller := &TestController{}
	controller.Route("GET", `/api/test`, controller.testAction)
	return controller
}

func (testController *TestController) testAction(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
}
