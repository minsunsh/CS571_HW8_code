import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';

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

// const API_KEY = "e8067b53"

interface suggestionData {
  name: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})

export class SearchComponent implements OnInit{

  searchMoviesCtrl = new FormControl();
  keywordSuggestions: any; //
  isLoading = false;
  // errorMsg!: string;
  selectedKeyword: any = "";
  isKeywordEmpty = false;
  isLocationEmpty = false;

  constructor(private http: HttpClient) {}
  // showResult = false;


  showResult: boolean = false;
  showDetails: boolean = false;
  dataReceived: boolean = false;

  eventDetailData: any;
  venueDetailData: any;
  artistData: any;

  jsonData = {}

  toggleDetails(event: any) {
    this.showResult = !event.showDetails;
    this.showDetails = event.showDetails;
    this.eventDetailData = event.eventDetailData;
    this.venueDetailData = event.venueDetailData;
    this.artistData = event.artistData;
  }
  

  checkboxForm = new FormGroup({
    isChecked: new FormControl(false)
  });

  searchForm = new FormGroup({
    keywordInput: new FormControl(''),
    distanceInput: new FormControl('10'),
    categoryInput: new FormControl('default'),
    locationInput: new FormControl('')
  });
  
  keywordOnKeyUp() {
    const keywordInput = String(this.searchForm.value['keywordInput']);
    if (keywordInput != '') {
      this.isKeywordEmpty = false;
    } 
  }

  locationOnKeyUp() {
    const locationInput = String(this.searchForm.value['locationInput']);
    const auto_detect = this.checkboxForm.value['isChecked'];

    if (locationInput != '' || auto_detect == true) {
      this.isLocationEmpty = false;
    } 
  }

  async submit(){
    var fin_location = ""
    var data = {}
    var search_result = {}
    this.showResult = false;
    this.showDetails = false;
    this.isKeywordEmpty = false;
    this.isLocationEmpty = false;
    this.dataReceived = false;


    const keyword_value = String(this.searchForm.value['keywordInput'])
    const distance_value = String(this.searchForm.value['distanceInput'])
    const category_value = String(this.searchForm.value['categoryInput'])
    const location_value = String(this.searchForm.value['locationInput'])
    const auto_detect = this.checkboxForm.value['isChecked']

    //define for ipInfo
    interface ipinfoResponse {
      loc: string;
    }

    //define data type for google API
    interface GeocodeResponse {
      results: GeocodeResult[];
    }

    interface GeocodeResult {
      geometry: Geometry;
    }

    interface Geometry {
      location: Location;
    }

    interface Location {
      lat: number;
      lng: number;
    }
    
    // console.log(this.searchForm.value)
    // console.log(this.checkboxForm.value);
    
    // this.http.post('/api', this.searchForm.value).subscribe(response => console.log(response));
    
    if (keyword_value === '') {
      this.isKeywordEmpty = true
    }


    else {
      if(location_value === '' && auto_detect === false) {
        this.isLocationEmpty = true
      }
      else {
        this.showResult = true;
        this.showDetails = false;

        if (auto_detect == true){
          // ipinfo api
          try {
            const response = await this.http.get<ipinfoResponse>('https://ipinfo.io?token=').toPromise();
            if (response && response.loc) {
              fin_location = response.loc;
              // console.log(fin_location);
              // console.log(response)
            } else {
              console.log('Location information not available.');
              this.dataReceived = true;
            }
          } catch (error) {
            console.log(error);
          }
        }
        else {
          // google map api
          try {
            const response = await this.http.get<GeocodeResponse>('https://maps.googleapis.com/maps/api/geocode/json?address='+ location_value + '&key=').toPromise();
            if (response && response.results[0]) {
              fin_location = String(response.results[0].geometry.location.lat)+','+String(response.results[0].geometry.location.lng)
              // console.log(fin_location);
            } else {
              fin_location = "none"
              console.log('Location information not available.');
              this.dataReceived = true;
            }
          } catch (error) {
            console.log(error);
          }
        }
        
        try {
          const response = await this.http.get('https://finalfinal-382323.wn.r.appspot.com/api/search?' + 'keyword=' + keyword_value + '&distance=' + distance_value + '&category=' + category_value + '&location=' + fin_location).toPromise();
          if (response) {
            search_result = response;
            this.jsonData = search_result;
            console.log("search result=======");
            console.log(this.jsonData);
            this.dataReceived = true;
          }
        } catch (error) {
          console.log(error);
        }
        
        
      }
    }
  }

  
  clear(){
    console.log("clear button");
    this.searchForm.patchValue({
      keywordInput: '',
      distanceInput: '10',
      categoryInput: 'default',
      locationInput: ''
    });

    this.checkboxForm.patchValue({
      isChecked: false
    });

    this.showResult = false;
    this.showDetails = false;
    this.isLocationEmpty = false;
    this.isKeywordEmpty = false;
    this.dataReceived = false;

    this.jsonData = {}

  }

  onSelected() {
    console.log(this.selectedKeyword);
    this.searchForm.patchValue({
      keywordInput: this.selectedKeyword
    });
  }

  // displayWith(value: any) {
  //   return value?.Title;
  // }

  // clearSelection() {
  //   this.selectedKeyword = "";
  //   this.keywordSuggestions = [];
  // }

  //ref: https://www.freakyjolly.com/mat-autocomplete-with-http-api-remote-search-results/
  ngOnInit() {
    this.searchForm.controls.keywordInput.valueChanges.pipe(
    // this.searchMoviesCtrl.valueChanges.pipe(
        distinctUntilChanged(), //only perform when it is different from previous
        debounceTime(1000),
        tap(() => {
          // this.errorMsg = "";
          this.keywordSuggestions = [];
          this.isLoading = true;
        }),
        //switchMap(value => this.http.get('http://www.omdbapi.com/?apikey=' + API_KEY + '&s=' + value)
        switchMap(value => this.http.get('https://finalfinal-382323.wn.r.appspot.com/api/autoComplete?'+'keyword='+ value)
          .pipe(
            finalize(() => {
              this.isLoading = false
            }),
          )
        )
      )
      .subscribe((data: any) => {
        console.log("data::::", data)
        if (data == undefined) { // TODO: 결과 안나올때 조건 잘 찾아서 바꿀것
          // this.errorMsg = data['Error'];
          this.keywordSuggestions = [];
        } else {
          // this.errorMsg = "";
          this.keywordSuggestions = data;
        }
        console.log(this.keywordSuggestions);
      });
  }
  
  setJsonDataAttr(value: unknown, property: keyof suggestionData): string | undefined {
    if (typeof value === 'object' && value !== null) {
      return (value as suggestionData)[property];
    }
    return undefined;
  }

  
  // auto_detect(){
  //  if(this.checkboxForm.value['isChecked'] == true) {
  //     console.log('auto-detect on!')
  //  }
  // }
}