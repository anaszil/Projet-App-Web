// some global variables
var data_music;
var data_video;
var title = document.getElementById("title");
var artist = document.getElementById("artist");
var image = document.getElementById("img_track");
var audio = document.getElementById('audio');
var source = document.getElementById('audioSource');
var index_current = 0;


//function to read JSON file with callback
function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send(); 
}

//similar to htmlspecialentities in php (prevent XSS attacks)
function escapeHtml(str)
{
    var map =
    {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, function(m) {return map[m];});
}

//function to play song from index, this func changes the background of <tr>
function play_music(index,elem){
    index_current = index;
    audio.loop = false;
    music = data_music[index];
    title.innerText = music["title"];
    artist.innerText = music["artist"];
    image.style.backgroundImage = "url("+music["cover"]+")"
    

    if(elem){
      var alltr = document.getElementsByTagName("tr");
      var ref = document.getElementsByClassName("fa-refresh");
      for (var i = 0; i < ref.length; i++) {
        ref[i].style.color = '#fff';
      }
      for (var i = 0; i<alltr.length; i++) {
          alltr[i].style.background = "none";
      }
      elem.style.background = "#100f0f";
    }

    source.src = music["path"];

    audio.load(); //to just preload the audio without playing
    audio.play(); //to play the song right away
}

// function to activate repeat feature
function onrepeat(ele){
  if(!audio.loop){
    audio.loop = true;
    ele.style.color = "#00c546";
  }else if(audio.loop == true){
    ele.style.color = "#fff";
    audio.loop = false;
  }else{
    audio.loop = true;
    ele.style.color = "#00c546";
  }
}

// function creating tr of songs in html
function read_music(){
    for (var i=0; i<data_music.length; i++) {
        table_body.innerHTML += '<tr onclick="play_music('+i+',this)" id="tr'+i+'"><th scope="row">'+(i+1)+'</th><td>'+escapeHtml(data_music[i].artist)+'</td><td>'+escapeHtml(data_music[i].title)+'</td><td><i class="fa fa-refresh" aria-hidden="true" onclick="event.stopPropagation();onrepeat(this);"></i></td><td>'+escapeHtml(data_music[i].time)+'</td></tr>';
    }
}

// this requests the file and executes a callback with the parsed result once
fetchJSONFile('playlist.json', function(data){
    data_music = data;
    read_music();
    var first_tr = document.getElementById("tr0");
    play_music(0,first_tr);
});

// EventListener of the end of a song in the audio player
audio.addEventListener('ended',function(){
  if(audio.loop!=true){
    var next_tr = document.getElementById("tr"+(index_current+1));
    var first_tr = document.getElementById("tr0");
    if(next_tr){
      play_music(index_current+1,next_tr);
    }else{
      play_music(0,first_tr);
    }
  }
});

//check if file is less tha 20MB and its extension is mp3 
function validateFile(files){
  const allowedExtensions =  ["mp3"],
        sizeLimit = 20000000; // 20 megabytes
  for (var i = 0; i < files.length ; i++) {
    const { name:fileName, size:fileSize } = files[i];
    const fileExtension = fileName.split(".").pop();

    if(!allowedExtensions.includes(fileExtension)){
      alert("le type de l'un des fichiers n'est pas autorisé");
      return false;
    }else if(fileSize > sizeLimit){
      alert("la taille de l'un des fichiers dépasse 20MB!")
      return false;
    }
  }
  return true;
}

//
let filesDone = 0;
let filesToDo = 0;
let uploadProgress = [];
let progressBar = document.getElementById("progress-bar");

const dropArea = document.getElementById("drop-area");

function preventDefaults(e){
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e){
  dropArea.classList.add("highlight");
}

function unhighlight(e){
  dropArea.classList.remove("highlight");
}

function handleDrop(e){
  // shorthand version
  // ([...e.dataTransfer.files]).forEach((file)=>{console.log("file...",file)});

  const dt = e.dataTransfer;
  const files = dt.files;

  handleFiles(files);
}

function handleFiles(files){
  if (validateFile(files)){
    const filesArray = [...files];
    initializeProgress(filesArray.length);
    filesArray.forEach(uploadFile);
  }
}


function uploadFile(file, i) {
  const url = "../";
  let xhr = new XMLHttpRequest();
  let formData = new FormData();

  xhr.open("POST", url, true);

  xhr.upload.addEventListener("progress", e => {
    var prog = (e.loaded * 100.0 / e.total) || 100;
    updateProgress(i, prog);
    if(prog == 100){
        console.log("done");
        location.reload();
    }
  });

  xhr.addEventListener(
    "readystatechange",
    function(resp) {
      if (xhr.status == 200) {
      } else{
        let formError = document.getElementById("formError");
        formError.innerHTML = "Une erreur s'est produite lors de l'importation";
        formError.style.visibility = "visible";
      }
    },
    false
    );

  formData.append("file", file);
  xhr.send(formData);
}

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});
["dragenter", "dragover"].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});
["dragleave", "drop"].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

dropArea.addEventListener("drop", handleDrop, false);


function initializeProgress(numFiles){
  console.log("entra", numFiles);
  progressBar.style.display = "block";
  progressBar.value = 0;
  uploadProgress = [];

  for (let i = numFiles; i > 0; i--) {
    uploadProgress.push(0);
  }
}

function updateProgress(fileNumber, percent){
  console.log('progress', fileNumber, percent)
  let total;
  uploadProgress[fileNumber] = percent;
  total = uploadProgress.reduce((tot, curr) => tot + curr, 0) / uploadProgress.length;
  progressBar.value = total;
}

// search songs in table
function search() {
    var input, filter, table, tr, a, i, txtValue;
    input = document.getElementById("search");
    filter = input.value.toUpperCase();
    table = document.getElementById("table_body");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
        td0 = tr[i].getElementsByTagName("td")[0];
        td1 = tr[i].getElementsByTagName("td")[1];
        
        txtValue = td0.textContent + td1.textContent;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            tr[i].style.display = "";
        } else {
            tr[i].style.display = "none";
        }
    }
}
// TODO : PLAYLISTS + MP4