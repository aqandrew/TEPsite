import { NgModule }        from '@angular/core';
import { BrowserModule }   from '@angular/platform-browser';
import { HTTP_PROVIDERS }  from '@angular/http';

import { AppComponent }  from './app.component';
import { AboutComponent } from './about.component';
import { MediaComponent } from './media.component';
import { RecruitmentComponent } from './recruitment.component';
import { PhilanthropyComponent } from './philanthropy.component';
import { BrothersComponent } from './brothers.component';
import { ContactComponent } from './contact.component';

@NgModule({
  imports: [ BrowserModule ],
  declarations: [
  	AppComponent,
  	AboutComponent,
  	MediaComponent,
  	RecruitmentComponent,
  	PhilanthropyComponent,
  	BrothersComponent,
  	ContactComponent
  ],
  providers: [ HTTP_PROVIDERS ],
  bootstrap: [ AppComponent ]
})

export class AppModule { }