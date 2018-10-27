package stress

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/satori/go.uuid"
)

type RequestMethod int

const (
	METHOD_GET RequestMethod = iota
	METHOD_POST
)

type RequestMode int

const (
	MODE_TIMEOUT RequestMode = iota
	MODE_REQUESTS_PER_THREAD
	MODE_REQUESTS
)

type StressSuiteRequest struct {
	ID         uuid.UUID
	URL        string
	Method     RequestMethod
	Threads    int
	Mode       RequestMode
	Timeout    int
	Iterations int
}

type StressSuite struct{}

func (suite *StressSuite) HandleRequest(suiteRequest *StressSuiteRequest) {
	var waitGroup sync.WaitGroup
	waitGroup.Add(suiteRequest.Threads)
	results := make([]*PerformedRequestsResult, suiteRequest.Threads)
	stressStatusInstance = &StressStatus{
		Status:  STATUS_RUNNING,
		Request: suiteRequest,
		Results: &results,
	}

	for i := 0; i < suiteRequest.Threads; i++ {
		result := &PerformedRequestsResult{
			SucceededRequestsTimings: []int64{},
			FailedRequestsTimings:    []int64{},
		}
		results[i] = result
		go func() {
			<-suite.performRequest(suiteRequest, result)
			waitGroup.Done()
		}()
	}

	waitGroup.Wait()
	stressStatusInstance.Status = STATUS_COMPLETED

	succeededRequests := 0
	for i := 0; i < suiteRequest.Threads; i++ {
		succeededRequests += results[i].SucceededRequests
	}
	fmt.Println("Number of succeeded requests", succeededRequests)
}

func (suite *StressSuite) performRequest(suiteRequest *StressSuiteRequest, result *PerformedRequestsResult) chan struct{} {
	done := make(chan struct{})
	go func(suiteRequest *StressSuiteRequest, performedRequestsResult *PerformedRequestsResult) {
		timeout := -1
		iterations := suiteRequest.Iterations
		if suiteRequest.Mode == MODE_TIMEOUT {
			timeout = suiteRequest.Timeout
			iterations = 9999999
		}
		startingTime := time.Now()
		performedRequestsResult.FailedRequests = 0
		performedRequestsResult.SucceededRequests = 0
		performedRequestsResult.StartingTime = startingTime
		for i := 0; i < iterations; i++ {
			elapsedMilliseconds := time.Since(startingTime).Nanoseconds() / int64(time.Millisecond)
			if timeout != -1 && elapsedMilliseconds >= int64(suiteRequest.Timeout) {
				break
			}
			startingRequestTime := time.Now()
			resp, err := http.Get(suiteRequest.URL)
			elapsedRequestMilliseconds := time.Since(startingRequestTime).Nanoseconds() / int64(time.Millisecond)
			if err != nil {
				performedRequestsResult.FailedRequests++
				performedRequestsResult.FailedRequestsTimings = append(performedRequestsResult.FailedRequestsTimings, elapsedRequestMilliseconds)
			} else {
				resp.Body.Close()
				performedRequestsResult.SucceededRequests++
				performedRequestsResult.SucceededRequestsTimings = append(performedRequestsResult.SucceededRequestsTimings, elapsedRequestMilliseconds)
			}
		}
		endingTime := time.Now()
		performedRequestsResult.EndingTime = endingTime
		timeDifference := endingTime.Sub(startingTime)
		performedRequestsResult.TimeDifference = timeDifference
		done <- struct{}{}
	}(suiteRequest, result)
	return done
}

type PerformedRequestsResult struct {
	FailedRequests           int
	SucceededRequests        int
	StartingTime             time.Time
	EndingTime               time.Time
	TimeDifference           time.Duration
	SucceededRequestsTimings []int64
	FailedRequestsTimings    []int64
}
