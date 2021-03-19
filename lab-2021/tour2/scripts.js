

//modal
var modal = document.getElementById("myModal");

//opens the modal
var btn = document.getElementById("ob");

//element that closes the modal
var span = document.getElementsByClassName("close")[0];

//open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

//close the modal
span.onclick = function() {
  modal.style.display = "none";
}

//clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}