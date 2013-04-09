// http://youtu.be/rQGjwsjtdwY?t=24m10s

var socket = chrome.experimental.socket || chrome.socket;
var socketInfo;


chrome.app.runtime.onLaunched.addListener(function(intentData) {
    
    var stringToUint8Array = function(string) {
        var buffer = new ArrayBuffer(string.length);
        var view = new Uint8Array(buffer);
        for(var i = 0; i < string.length; i++) {
          view[i] = string.charCodeAt(i);
        }
        return view;
      };
      
    var write200Response = function(socketId, content, contentType, keepAlive) {
        //var contentType = "text/html";
        var contentLength = content.byteLength;
        var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + contentLength + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
        var outputBuffer = new ArrayBuffer(header.byteLength + contentLength);
        var view = new Uint8Array(outputBuffer);
        view.set(header, 0);
        view.set(new Uint8Array(content), header.byteLength);
        
        socket.write(socketId, outputBuffer, function(writeInfo) {
                 console.log("WRITE", writeInfo);
                 if (keepAlive) {
                     readFromSocket(socketId);
                 } else {
                     socket.destroy(socketId);
                     socket.accept(socketInfo.socketId, onAccept);
                 }
        });
        
    };
    
    var writeJSONResponse = function(socketId, content, contentType, keepAlive) {
        var content = stringToUint8Array(content);
        var contentLength = content.byteLength;
        
        var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + contentLength + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
        var outputBuffer = new ArrayBuffer(header.byteLength + contentLength);
        var view = new Uint8Array(outputBuffer);
        view.set(header, 0);
        view.set(new Uint8Array(content), header.byteLength);
        socket.write(socketId, outputBuffer, function(writeInfo) {
                 console.log("WRITE", writeInfo);
                 if (keepAlive) {
                     readFromSocket(socketId);
                 } else {
                     socket.destroy(socketId);
                     socket.accept(socketInfo.socketId, onAccept);
                 }
        });
    }
    
    var arrayBufferToString = function(buffer) {
        var str = '';
        var uArrayVal = new Uint8Array(buffer);
        for(var s = 0; s < uArrayVal.length; s++) {
          str += String.fromCharCode(uArrayVal[s]);
        }
        return str;
      };
    
    var readFromSocket = function(socketId) {
        
        console.log(socketId);
        
        socket.read(socketId, function(readInfo) {
            console.log("READ", readInfo);
            var data = arrayBufferToString(readInfo.data);
            
            
            if(data.indexOf("GET ") == 0) {
                var keepAlive = false;
                if (data.indexOf("Connection: keep-alive") != -1) {
                    keepAlive = true;
                }
                
                var uriEnd =  data.indexOf(" ", 4);
                if(uriEnd < 0) { return; }
                var uri = data.substring(4, uriEnd);
                
                // strip query string
                var q = uri.indexOf("?");
                
                if (q != -1) {
                    uri = uri.substring(0, q);
                }
            
                var xhr = new XMLHttpRequest();
            
                xhr.open('GET', uri);
            
                console.log("GET",uri);
            
                var contentType = "text/plain";

                if(uri.indexOf(".htm")!=-1) contentType = "text/html";
                if(uri.indexOf(".css")!=-1) contentType = "text/css";
                if(uri.indexOf(".jpg")!=-1) contentType = "image/jpg";
                if(uri.indexOf(".png")!=-1) contentType = "image/png";
                if(uri.indexOf(".gif")!=-1) contentType = "image/gif";
                if(uri.indexOf(".json")!=-1) contentType = "application/json";

                xhr.responseType = 'arraybuffer';

                xhr.onload = function(e) {
                  console.log(this.response);
                  write200Response(socketId, this.response, contentType, keepAlive);
                };

                xhr.send();
            
                
            }
            else {
                socket.destroy(socketId);
            }
        
        });
        
    };
    
    var storeToken = function(access_token){
        chrome.storage.sync.set({'access_token': access_token}, function() {
			console.log(access_token+' saved.');
		});
    }
    
    var onAccept = function(acceptInfo) {
        console.log("ACCEPT", acceptInfo)
        readFromSocket(acceptInfo.socketId);
      };
    
    
    socket.create("tcp", {}, function(_socketInfo) {
        if (socketInfo) socket.destroy(socketInfo.socketId);
        socketInfo = _socketInfo;
        socket.listen(socketInfo.socketId, "127.0.0.1", 8000, 50, function(result) {
            console.log("LISTENING:", result);
            socket.accept(socketInfo.socketId, function(acceptInfo) {
                console.log("ACCEPT", acceptInfo);
                readFromSocket(acceptInfo.socketId);
                
              });
              
              
        });
        
        socket.getInfo(socketInfo.socketId, function(result){
            if(result) {
                console.log("READY", result);
                
                
                
                chrome.app.window.create('quickstart.html', {
                      'bounds': {
                        'width': 800,
                        'height': 600
                      }
                    });
            }
        });
    });
    
});


