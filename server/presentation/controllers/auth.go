package controllers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"

	jwt "github.com/dgrijalva/jwt-go"
)

type AuthController struct {
	BaseController
}

func MakeAuthController() *AuthController {
	controller := &AuthController{}
	controller.Route("POST", `/api/login`, controller.doLogin)
	return controller
}

func (authController *AuthController) doLogin(w http.ResponseWriter, r *http.Request) {
	buffer := new(bytes.Buffer)
	io.Copy(buffer, r.Body)
	// defer r.Body.Close()
	requestBody := strings.TrimSpace(buffer.String())
	var authenticationPayload struct {
		Password string `json:"password"`
	}
	err := json.Unmarshal([]byte(requestBody), &authenticationPayload)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	if authenticationPayload.Password != GetPassword() {
		w.WriteHeader(401)
		return
	}
	token := jwt.New(jwt.SigningMethodHS256)
	tokenString, err := token.SignedString(GetSecret())
	if err != nil {
		w.WriteHeader(500)
		return
	}
	authController.JsonResult(struct {
		Token string `json:"token"`
	}{Token: tokenString})(w, r)
}

func GetSecret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}

func GetPassword() string {
	return os.Getenv("AUTH_PASSWORD")
}
