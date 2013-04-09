
var authorizeButton = document.getElementById("authorizeButton");
var createFileButton = document.getElementById("createFile");

function init(){
    authorizeButton.onclick = authorizeClick;
    createFileButton.onclick = createFile;

    gapi.load("auth:client,drive-realtime,drive-share", function(){
        
        authorizeButton.disabled = false;
        
        
        var access_token = window.localStorage["access_token"];
        if(access_token != null){
            var xhr = new XMLHttpRequest();

    		var tokenVerUrl = "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token="+access_token;

    		xhr.open('GET', tokenVerUrl)

    		xhr.onload = function(e) {
    		    if(this.status != 400) {
    		        authorizeButton.disabled = true;
    		        token = JSON.parse(this.response);
    		        console.log("TOKEN",token);
    		        createFileButton.disabled = false;
    		        compileList();
    	        }
    		}

    		xhr.send();
		}
    });
    
    
}

function authorizeClick() {
    window.location.href = "https://accounts.google.com/o/oauth2/auth?scope=https%3A%2F%2Fwww.googleapis.com/auth/drive.install+https%3A%2F%2Fwww.googleapis.com/auth/drive.file&redirect_uri=http%3A%2F%2Flocalhost:8000/oauth2callback.html&response_type=token&client_id=[REPLACE ME WITH YOUR CLIENT ID]&approval_prompt=auto";
}

function linkClick(e) {
    var fileId = e.target.id;
    loadFile(fileId);
}

function compileList() {
    var nav = document.getElementById("nav");
    nav.innerHTML = "";
    var access_token = window.localStorage["access_token"];
       if(access_token!=null){
           var token = {'access_token':access_token};
           gapi.auth.setToken(token);
           gapi.client.load('drive', 'v2', function() {
               var request = gapi.client.drive.files.list({'q':"title='realtime' and trashed=false"});
               request.execute(function(response){
                   var items = response.items;
                   for(var i=0; i<items.length; i++){
                       var fileId = items[i].id;
                       var a = document.createElement("a");
                       var d = document.createElement("div");
                       a.href= "#";
                       a.onclick = linkClick;
                       a.id = fileId;
                       a.innerHTML = "realtime";
                       d.appendChild(a);
                       nav.appendChild(d);
                   }
               });
           });
           
        }

}

function createFile() {
    var access_token = window.localStorage["access_token"];
    if(access_token!=null){
        var token = {'access_token':access_token};
        gapi.auth.setToken(token);
        var metadata = {
            'title': 'realtime',
            'mimeType': 'application/vnd.google-apps.drive-sdk'
        };
        var request = gapi.client.request({
            'path': 'drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': metadata});

        request.execute(fileInserted);
    }
}


function fileInserted(file) {
    console.log("REALTIME FILE CREATED",file);
    var fileId = file.id;
    loadFile(fileId);
    compileList();
}

function loadFile(fileId) {
    var access_token = window.localStorage["access_token"];
       if(access_token!=null){
           var token = {'access_token':access_token};
           gapi.auth.setToken(token);
           gapi.drive.realtime.load(fileId, onFileLoaded, initializeModel);
       }
}

function onStringChanged(evt) {
  // Log the event to the console.
  console.log(evt);
}

function onFileLoaded(doc) {
    var textArea1 = document.getElementById('editor1');
    //var textArea2 = document.getElementById('editor2');

    var string = doc.getModel().getRoot().get('text');

    // Keeping one box updated with a String binder.

    gapi.drive.realtime.databinding.bindString(string, textArea1);

    // Keeping one box updated with a custom EventListener.
    //var updateTextArea2 = function(e) {
    //    textArea2.value = string;
    //};
    //string.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, updateTextArea2);
    //string.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, updateTextArea2);
    //textArea2.onkeyup = function() {
    //    string.setText(textArea2.value);
    //};
    //updateTextArea2();

    // Enabling UI Elements.
    textArea1.disabled = false;
    //textArea2.disabled = false;
}

function initializeModel(model) {
    var string = model.createString("Hello Realtime World!");
    model.getRoot().set("text", string);
}

window.onload = init;