
FROM golang:1.24 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download



COPY . .
COPY .env .env
RUN CGO_ENABLED=0 GOOS=linux go build -o main .


FROM alpine:latest

WORKDIR /root/
COPY --from=builder /app/main .

COPY --from=builder /app/.env .env

EXPOSE 8080

CMD ["./main"]
