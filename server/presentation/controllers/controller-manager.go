package controllers

import (
	"net/http"
	"regexp"

	"github.com/wufe/acheron/server/presentation"
)

type ControllerManager struct {
	request *http.Request
}

func (controllerManager *ControllerManager) For(r *http.Request) {
	controllerManager.request = r
}

func (controllerManager *ControllerManager) GetHandler(controller presentation.Controller) presentation.Action {
	actions := controller.GetActions()
	for _, action := range actions {
		pattern, err := regexp.Compile(action.GetRe())
		if err == nil && pattern.MatchString(controllerManager.request.URL.Path) {
			return action
		}
	}
	return nil
}
