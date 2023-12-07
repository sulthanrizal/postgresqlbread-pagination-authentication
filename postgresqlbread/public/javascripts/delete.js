function on(id, title) {
    document.getElementById("notif").style.display = "block";
    document.getElementById("nextdelete").setAttribute('href', `/delete/${id}`);
    document.getElementById("ask").innerHTML = `Apakah kamu yakin akan menghapus data '${title}'?`;
}

function off() {
    document.getElementById("notif").style.display = "none";
}  