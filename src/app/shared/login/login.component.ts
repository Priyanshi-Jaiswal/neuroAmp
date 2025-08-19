import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: any;
  user: string = '';

  constructor(private router: Router, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      "username": ['', [Validators.required]],
      "password": ['', [Validators.required]],
    })
  }

  onLogin() {
    sessionStorage.setItem('isFirstTimeLoad', 'true');
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      sessionStorage.setItem('userName', username);

      if (username === 'admin' && password === 'admin') {
        this.router.navigate(['/dashboard'])
      } else {
        alert('Incorrect Username or Password');
        this.loginForm.reset();
      }
    }
  }
}
