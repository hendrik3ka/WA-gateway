# WA-gateway
WhatsApp Gateway

# Let's start
## Clone Repo and install packages
    git clone https://github.com/hendrik3ka/WA-gateway
    cd main / root folder
    npm install

## Clone Repo and install packages
    git clone https://github.com/hendrik3ka/WA-gateway
    cd WA-gateway
    npm install
    npm update
    
## Run
    npm run start
    Start to scan the QR Code
    
## Postman
### Send Message
POST /send-message

localhost:3000/send-message

**Body** *raw (json)*
```
{
    whatsapp: 62xxxxxxxxx,
    message: Hello
}
```
