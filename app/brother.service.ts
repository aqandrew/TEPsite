import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Brother } from './brother';

@Injectable()
export class BrotherService {
	constructor (private http: Http) {}

	private brotherDataFile = 'data/TEP EI brothers.csv';

	getBrothers(): Observable<Brother[]> {
		return this.http.get(this.brotherDataFile)
			.map(this.extractBrotherData)
			.catch(this.handleError);
	}

	private extractBrotherData(res: Response) {
		let body = res.text();
		return body || { };
	}

	private handleError (error: any) {
		// In a real world app, we might use a remote logging infrastructure
		// We'd also dig deeper into the error to get a better message
		let errMsg = (error.message) ? error.message :
			error.status ? `${error.status} - ${error.statusText}` : 'Server error';
		console.error(errMsg); // log to console instead
		return Observable.throw(errMsg);
	}
}