package controllers

import (
	"net/http"

	uuid "github.com/satori/go.uuid"
	"github.com/wufe/acheron/server/stress"
)

type StressController struct {
	BaseController
	Suite *stress.StressSuite
}

func MakeStressController() *StressController {
	controller := &StressController{
		Suite: &stress.StressSuite{},
	}
	controller.Route("POST", `/api/restricted/stress/perform`, controller.performStressTest)
	controller.Route("POST", `/api/restricted/stress/status`, controller.getStressStatus)
	return controller
}

func (stressController *StressController) performStressTest(w http.ResponseWriter, r *http.Request) {

	var stressPayload struct {
		Mode     string `json:"mode"`
		Requests int    `json:"requests"`
		Threads  int    `json:"threads"`
		Timeout  int    `json:"timeout"`
		URL      string `json:"url"`
	}
	stressController.FromJson(&stressPayload)(w, r)

	go func() {
		mode := stress.MODE_REQUESTS
		if stressPayload.Mode == "requests_per_thread" {
			mode = stress.MODE_REQUESTS_PER_THREAD
		} else if stressPayload.Mode == "timeout" {
			mode = stress.MODE_TIMEOUT
		}
		stressController.Suite.HandleRequest(&stress.StressSuiteRequest{
			ID:         uuid.Must(uuid.NewV1()),
			Iterations: stressPayload.Requests,
			Method:     stress.METHOD_GET,
			Mode:       mode,
			Threads:    stressPayload.Threads,
			Timeout:    stressPayload.Timeout,
			URL:        stressPayload.URL,
		})
	}()

	w.WriteHeader(200)
	// stressController.FromJson(&stressPayload)(w, r)
	// w.Write([]byte(stressPayload.Endpoint))
}

type RunningStressResponseRequestPayload struct {
	ID         string `json:"id"`
	Iterations int    `json:"iterations"`
	Method     string `json:"method"`
	Mode       string `json:"mode"`
	Threads    int    `json:"threads"`
	Timeout    int    `json:"timeout"`
	URL        string `json:"url"`
}

type RunningStressResponseTimingsPayload struct {
	FailedRequestsTimings    []int64 `json:"failed"`
	SucceededRequestsTimings []int64 `json:"succeeded"`
}

type RunningStressResponsePayload struct {
	Status                 string                               `json:"status"`
	Request                *RunningStressResponseRequestPayload `json:"request"`
	Timings                *RunningStressResponseTimingsPayload `json:"timings"`
	TotalSucceededRequests uint64                               `json:"totalSucceeded"`
	TotalFailedRequests    uint64                               `json:"totalFailed"`
	TotalTime              uint64                               `json:"totalTime"`
}

func (stressController *StressController) getStressStatus(w http.ResponseWriter, r *http.Request) {
	stressStatus := stress.GetStressStatus()
	status := "idle"
	if stressStatus.Status == stress.STATUS_RUNNING {
		status = "running"
	}
	if stressStatus.Status == stress.STATUS_COMPLETED {
		status = "completed"
	}
	if status == "idle" {
		stressController.JsonResult(struct {
			Status string `json:"status"`
		}{
			Status: status,
		})(w, r)
	} else {
		method := "get"
		if stressStatus.Request.Method == stress.METHOD_POST {
			method = "post"
		}
		mode := "timeout"
		if stressStatus.Request.Mode == stress.MODE_REQUESTS {
			mode = "requests"
		}
		if stressStatus.Request.Mode == stress.MODE_REQUESTS_PER_THREAD {
			mode = "requests_per_thread"
		}
		totalFailedRequestsTimings := []int64{}
		totalSucceededRequestsTimings := []int64{}
		done := make(chan (struct{}))
		go func() {
			for i := 0; i < len(*stressStatus.Results); i++ {
				totalFailedRequestsTimings = append(totalFailedRequestsTimings, (*stressStatus.Results)[i].FailedRequestsTimings...)
				(*stressStatus.Results)[i].FailedRequestsTimings = []int64{}
				totalSucceededRequestsTimings = append(totalSucceededRequestsTimings, (*stressStatus.Results)[i].SucceededRequestsTimings...)
				(*stressStatus.Results)[i].SucceededRequestsTimings = []int64{}
			}
			stressController.JsonResult(&RunningStressResponsePayload{
				Status: status,
				Request: &RunningStressResponseRequestPayload{
					ID:         stressStatus.Request.ID.String(),
					Iterations: stressStatus.Request.Iterations,
					Method:     method,
					Mode:       mode,
					Threads:    stressStatus.Request.Threads,
					Timeout:    stressStatus.Request.Timeout,
					URL:        stressStatus.Request.URL,
				},
				Timings: &RunningStressResponseTimingsPayload{
					FailedRequestsTimings:    totalFailedRequestsTimings,
					SucceededRequestsTimings: totalSucceededRequestsTimings,
				},
				TotalSucceededRequests: stressStatus.TotalSucceededRequests,
				TotalFailedRequests:    stressStatus.TotalFailedRequests,
				TotalTime:              stressStatus.TotalTime,
			})(w, r)
			// TODO: It may require a different approach
			if status == "completed" {
				stress.SetStatusToIdle()
			}
			done <- struct{}{}
		}()
		<-done
	}
}
