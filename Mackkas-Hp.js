let img_btn = document.querySelectorAll(".img1")
let Logo_Img = document.querySelector(".logo_img_hide")

img_btn.forEach((img) => {
    img.addEventListener("click", (e) => {
       location.href = "LoginPage.html"
    })
})



setTimeout(() => {
 Logo_Img.className = "logo_img"
}, 1000)


