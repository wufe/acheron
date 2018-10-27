package controllers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/wufe/acheron/server/presentation"
	"github.com/wufe/acheron/server/utils"
)

type ActionImpl struct {
	regexp string
	method string
	handle func(w http.ResponseWriter, r *http.Request)
}

func (action *ActionImpl) GetRe() string {
	return action.regexp
}

func (action *ActionImpl) GetMethod() string {
	return action.method
}

func (action *ActionImpl) Handle(w http.ResponseWriter, r *http.Request) {
	action.handle(w, r)
}

type BaseController struct {
	actions []presentation.Action
}

func (baseController *BaseController) GetActions() []presentation.Action {
	return baseController.actions
}

func (baseController *BaseController) Route(method string, regexp string, handle func(w http.ResponseWriter, r *http.Request)) *BaseController {
	baseController.actions = append(baseController.actions, &ActionImpl{method: method, regexp: regexp, handle: handle})
	return baseController
}

type RequestResult func(w http.ResponseWriter, r *http.Request)

func (baseController *BaseController) JsonResult(object interface{}) RequestResult {
	return func(w http.ResponseWriter, r *http.Request) {
		serialized, err := json.Marshal(object)
		if err != nil {
			w.WriteHeader(500)
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.Write(serialized)
		}
	}
}

func (baseController *BaseController) FromJson(recipient interface{}) func(http.ResponseWriter, *http.Request) error {
	return func(w http.ResponseWriter, r *http.Request) error {
		body := utils.ExtractBodyFromRequest(r)
		requestBody := strings.TrimSpace(string(body))
		return json.Unmarshal([]byte(requestBody), recipient)
	}
}
