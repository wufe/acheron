package server

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/wufe/acheron/server/presentation"
	"github.com/wufe/acheron/server/presentation/controllers"
)

type Adapter func(http.Handler) http.HandlerFunc

func middlewareAdapt(h http.HandlerFunc, adapters ...Adapter) http.Handler {
	for _, adapter := range adapters {
		h = adapter(h)
	}
	return h
}

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func gzipMiddleware() Adapter {
	return func(h http.Handler) http.HandlerFunc {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
				h.ServeHTTP(w, r)
				return
			}
			w.Header().Set("Content-Encoding", "gzip")
			gz := gzip.NewWriter(w)
			defer gz.Close()
			gzr := gzipResponseWriter{Writer: gz, ResponseWriter: w}
			h.ServeHTTP(gzr, r)
		})
	}
}

type AuthenticationToken struct {
	Token string `json:"token"`
}

func isAuthorizationValid(r *http.Request) bool {
	authenticationHeader := r.Header.Get("Authorization")
	if authenticationHeader != "" {
		pattern, err := regexp.Compile(`^Bearer (.+?)$`)
		if err == nil && pattern.MatchString(authenticationHeader) {
			foundMatches := pattern.FindStringSubmatch(authenticationHeader)
			if len(foundMatches) > 0 {
				foundBearer := pattern.FindStringSubmatch(authenticationHeader)[1]
				if foundBearer != "" {
					// fmt.Printf("Found bearer token: [%s]\n", foundBearer)
					token, _ := jwt.Parse(foundBearer, func(token *jwt.Token) (interface{}, error) {
						if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
							return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
						}
						return controllers.GetSecret(), nil
					})
					if token.Valid {
						return true
					}
				}
			}
		}
	}
	return false
}

func authenticationMiddleware() Adapter {
	return func(h http.Handler) http.HandlerFunc {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.Contains(r.RequestURI, "/api/restricted") {
				if isAuthorizationValid(r) {
					h.ServeHTTP(w, r)
				} else {
					w.WriteHeader(401)
				}
			} else {
				h.ServeHTTP(w, r)
			}
		})
	}
}

func getControllerAction(w http.ResponseWriter, r *http.Request) presentation.Action {
	ctrls := [...](presentation.Controller){controllers.MakeTestController(), controllers.MakeStressController(), controllers.MakeAuthController(), controllers.MakeStaticController()}

	controllerManager := controllers.ControllerManager{}
	controllerManager.For(r)

	for _, controller := range ctrls {
		if handler := controllerManager.GetHandler(controller); handler != nil {
			return handler
		}
	}

	return nil
}

func handler(w http.ResponseWriter, r *http.Request) {

	action := getControllerAction(w, r)
	if action != nil {
		action.Handle(w, r)
	} else {
		w.WriteHeader(404)
	}
}

func Start(port int) {
	fmt.Printf("Using port %d\r\n", port)
	http.Handle("/", middlewareAdapt(handler, gzipMiddleware(), authenticationMiddleware()))
	http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
}
