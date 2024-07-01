# syno-slideshow

Turn a shared album from Synology Photos into a simple slideshow.

# Setup

```
$ git clone https://github.com/akmolina28/syno-slideshow.git

$ cd syno-slideshow

$ docker compose up -d
```

Open browser to http://localhost:8089/

## Url Options

|Option|Description|Required|Default|
|-|-|-|-|
|shareUrl|The share link for your album|yes|-
|w|Set width in pixels|no|600
|h|Set height in pixels|no|400

Example: http://localhost:8089/?shareUrl=https://johndoe.synology.me/photo/mo/sharing/abcd1234&h=900&w=900