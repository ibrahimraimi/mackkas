let Form = document.getElementById("form");
let Name_Input = document.getElementById("name");
let Password_Input = document.getElementById("password")
let Email = document.getElementById("email");
let NameError = document.querySelector(".hide");
let EmailError = document.querySelector(".email_hide");
let PasswordError = document.querySelector(".password_hide")
let Acc_succ = document.querySelector(".successful_hide")
let Validate_err = document.querySelector(".validate_hide")

let isNameError = false;
let isEmailError = false;
let isEmailFound = false;
let isPasswordError = false;
let isNotEmpty = false;

//storage
let GetUsers = sessionStorage.getItem("users")
let Users = GetUsers ? JSON.parse(GetUsers) : []
console.log(Users);

//Authentication


const reg_name = /([a-zA-Z]){3,10}$/
const reg_email = /(\<|^)[\w\d._%+-]+@(?:[\w\d-]+\.)+(\w{2,})(\>|$)/;
const reg_password = /^[a-zA-Z0-9!@#$%^&*_]{6,16}$/

function NameMatch(){
  let NameValue = Name_Input.value.trim()
  if(!NameValue){
    NameError.className = "hide"
    Name_Input.style.borderColor = "transparent"
    isNotEmpty = false;
    isNameError = false;
    console.log("No input");
  }
  else if(reg_name.test(NameValue)){
    Name_Input.style.borderColor = "transparent"
    isNameError = true;
    isNotEmpty = true;
    NameError.className = "hide"
    console.log("Match");
  }
  else{
    NameError.className = "name"
    Name_Input.style.borderColor = "red"
    isNotEmpty = true;
    isNameError = false;
    console.log("Not Match");
  }

  console.log(NameValue);

}

function EmailMatch(){
let EmailValue = Email.value.trim()
let GetUsers = sessionStorage.getItem("users")
let Users =  GetUsers ? JSON.parse(GetUsers) : []

const Email_Find = Users.find((user) => user.Email_Value == EmailValue)
console.log(Email_Find);

if(Email_Find){
  isEmailFound = true;
  console.log("The Email Already Exist");
}

else{
  isEmailFound = false;
}


if(reg_email.test(EmailValue)){
  EmailError.className = "email_hide"
  Email.style.borderColor = "transparent"
  isNotEmpty = true;
  isEmailError = true;
  console.log("Email matched");
}
else if(!EmailValue){
  EmailError.className = "email_hide"
  Email.style.borderColor = "transparent"
  isNotEmpty = false;
  isEmailError = false;
  console.log("No input for Email");
}
else{
  EmailError.className = "email"
  Email.style.borderColor = "red"
  isEmailError = false;
  isNotEmpty = true;
  console.log("Email not matched");
}

}

function PasswordMatch(){
let PasswordValue = Password_Input.value.trim();
if(reg_password.test(PasswordValue) ){
  PasswordError.className = "password_hide"
  Password_Input.style.borderColor = "transparent"
  isPasswordError = true;
  isNotEmpty = true;
  console.log("Password matched");
  
}
else if(!PasswordValue){
  PasswordError.className = "password_hide"
  Password_Input.style.borderColor = "transparent"
  isPasswordError = false;
  isNotEmpty = false;
  console.log("No input for Password");
}
else{
  PasswordError.className = "password"
  Password_Input.style.borderColor = "red"
  isPasswordError = false;
  isNotEmpty = true;
  console.log("password not matched");
}

}

Name_Input.addEventListener("keyup", (e) => {
  // e.preventDefault();
  NameMatch();
  
})

Email.addEventListener("keyup", (e) => {
  // e.preventDefault();
  EmailMatch();
  
})

Password_Input.addEventListener("keyup", (e) => {
  PasswordMatch();
})

Form.onsubmit = function(e){

  let Name = document.getElementById("name").value;
  let Password = document.getElementById("password").value;
  let Email_Value = Email.value;

 

  let Logins = {
    Name,
    Password,
    Email_Value

  }

if(isNameError == true && isEmailError == true && isPasswordError == true && isEmailFound == false){
  Acc_succ.className = "successful"
  Validate_err.className = "validate_hide";
  setTimeout(() => {
    Acc_succ.className = "successful_hide"
   }, 2000)

   setTimeout(() => {
    Users.push(Logins);
    sessionStorage.setItem("users", JSON.stringify(Users))
    location.href = "LoginPage.html"
   }, 3000)
 
}

else{
  Validate_err.className = "validate";
  if(isNameError == false)
  {
    NameError.className = "name"
    Name_Input.style.borderColor = "red"
  }

  if(isEmailError == false)
  {
    EmailError.className = "email"
    Email.style.borderColor = "red"
  }

  if(isPasswordError == false)
  {
    PasswordError.className = "password"
    Password_Input.style.borderColor = "red"
  }

  if(isEmailFound == true){
    EmailError.innerHTML = "<br>This Email Already Exists"
    EmailError.className = "email"
    Email.style.borderColor = "red"
  }
  
}

  
  console.log(Users);
  e.preventDefault();
  document.getElementById("form").reset() 
  

  
  
}

 console.log(Users);
 console.log(isNotEmpty);







