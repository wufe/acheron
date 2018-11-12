if ($(Test-Path package)) {
    Remove-Item -Recurse package
}
mkdir package
Invoke-Expression "go build main.go"
Move-Item main.exe package/acheron.exe
yarn run build:client
Copy-Item -Recurse dist package
Copy-Item .env.example package/.env