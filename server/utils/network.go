package utils

import (
	"bytes"
	"io/ioutil"
	"net/http"
)

func ExtractBodyFromRequest(r *http.Request) []byte {
	// buffer := new(bytes.Buffer)
	// io.Copy(buffer, r.Body)
	// r.Body.Close()
	buffer, _ := ioutil.ReadAll(r.Body)
	reader := bytes.NewBuffer(buffer)
	readCloser := ioutil.NopCloser(reader)
	r.Body = readCloser
	return buffer
}
