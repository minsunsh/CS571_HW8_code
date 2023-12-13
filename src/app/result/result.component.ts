import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

export interface JsonData {
  id: string; 
  date: string; 
  time: string;
  icon: string;
  event: string;
  genre: string;
  venue: string;
  music: string;
}

export interface detailData {
  name: string,
  date: string,
  time: string,
  aot: string,
  venue: string,
  genre: string,
  priceMin: string,
  priceMax: string,
  status: string,
  status_class: string,
  seatmap: string,
  buyurl: string,
  id: string
}

export interface artistData {
  name: string,
  followers: string,
  popularity: string,
  link: string,
  photo: string,
  album1: string,
  album2: string,
  album3: string
}

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})

export class ResultComponent{

  constructor(private http: HttpClient) {}

  @Input() jsonData: any;
  @Output() showDetailsEvent: EventEmitter<any> = new EventEmitter();



  eventDetailData = {}
  venueDetailData = {}
  artistData = {}

  result_exists = false;
  showDetails = false;
  showResult = true;


  eventDetail(id: any, venue:any, artist:any) {

    console.log("artisttt: ", artist)
    console.log("venue:", venue)

    this.showDetails = true;
    this.showResult = false;
    console.log("clicked"+id)

    var search_result = {}
    var venue_search_result = {}
    var artist_search_result = {}

    const eventDetail$ = this.http.get('https://finalfinal-382323.wn.r.appspot.com/api/eventDetail?' + 'id=' + id);
    const venueDetail$ = this.http.get('https://finalfinal-382323.wn.r.appspot.com/api/venueDetail?' + 'venue=' + venue);
    const artistDetail$ = this.http.get('https://finalfinal-382323.wn.r.appspot.com/api/artistDetail?' + 'artist=' + artist);

    forkJoin([eventDetail$, venueDetail$, artistDetail$]).subscribe(
      ([eventDetailData, venueDetailData, artistData]) => {
        this.eventDetailData = eventDetailData
        this.venueDetailData = venueDetailData
        this.artistData = artistData

        this.showDetailsEvent.emit({
          showDetails: true,
          eventDetailData: this.eventDetailData,
          venueDetailData: this.venueDetailData,
          artistData: this.artistData
        });

      })
  
  }
  dataLength(jsonData:any) {
    return Object.keys(jsonData).length
  }

  setJsonDataAttr(value: unknown, property: keyof JsonData): string | undefined {
    if (typeof value === 'object' && value !== null) {
      return (value as JsonData)[property];
    }
    return undefined;
  }

  sortKeysNumerically(a:any, b:any) {
    return parseInt(a.key) - parseInt(b.key);
  }
}
