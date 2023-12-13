import { Component, Input, Output, EventEmitter, Renderer2 } from '@angular/core';
import { ElementRef, AfterViewInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';


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
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})

export class DetailsComponent implements AfterViewInit{
  
  selectedTabIndex = 0;

  public modal: boolean = false;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngAfterViewInit() {
    

    setTimeout(() => {
      const headerElement = this.el.nativeElement.querySelector('.mat-mdc-tab-label-container');
      if (headerElement) {
        this.renderer.setStyle(headerElement, 'background-color', 'rgb(99, 165, 144)');
      }
      const padding = this.el.nativeElement.querySelector('.mat-mdc-tab-labels');
      if (padding) {
        this.renderer.addClass(padding, 'mx-5')
      }

      //ref: https://stackoverflow.com/questions/46249541/change-arrow-colors-in-bootstraps-carousel
      const next_arrow = this.el.nativeElement.querySelector('.carousel-control-next-icon');
      if (next_arrow) {
        this.renderer.setStyle(next_arrow, 'filter', 'invert(90%);');
      }
      const prev_arrow = this.el.nativeElement.querySelector('.carousel-control-prev-icon');
      if (prev_arrow) {
        this.renderer.setStyle(prev_arrow, 'filter', 'invert(90%);');
      }

      
    });

    
  }


  @Output() goBackEvent: EventEmitter<boolean> = new EventEmitter();


  long = 0
  lat = 0

  mapOptions: google.maps.MapOptions = {
    center: { lat: 0, lng: 0 },
    zoom : 14
  }

  marker = {
    position: { lat: 0, lng: 0 },
  }


  showFullContent = {
    openHours: false,
    generalRule: false,
    childRule: false,
  };


  clickedModalClose() {
    this.modal = false;
  }

  clickedModal(long: any, lat: any) {
    this.modal = true;
    this.long = Number(long);
    this.lat = Number(lat);
    this.updateMapOptionsAndMarker(this.lat, this.long);
  }

  updateMapOptionsAndMarker(lat: number, lng: number) {
    this.mapOptions = {
      center: { lat: lat, lng: lng },
      zoom: 14,
    };
    this.marker = {
      position: { lat: lat, lng: lng },
    };
  }

  @Input() eventDetailData: any;
  @Input() venueDetailData: any;
  @Input() artistData: any;

  isFavorite = false;

  setJsonDataAttr(value: unknown, property: keyof detailData): string | undefined {
    if (typeof value === 'object' && value !== null) {
      return (value as detailData)[property];
    }
    return undefined;
  }

  addFavorites(value: detailData) {

    if (this.isFavorite == false){
      alert("Event Added to Favorites!")
      this.isFavorite = !this.isFavorite;

      const newData = {
        id: value.id,
        date: value.date, 
        event: value.name,
        genre: value.genre,
        venue: value.venue
      }
      const newDataString = JSON.stringify(newData);

      let maxKey = -1;
      for (let i = 0; i < localStorage.length; i++) {
        const keyValue = localStorage.key(i);
        if (keyValue) {
          const numericKey = parseInt(keyValue);
          if (numericKey > maxKey) {
            maxKey = numericKey;
          }
        }
      }

      const nextKey = String(maxKey + 1);
      localStorage.setItem(nextKey, newDataString);

      
      // console.log("id:::::::?? ", value.id)
    }

    else {
      alert("Event Removed from Favorites!")
      this.isFavorite = !this.isFavorite;

      for (let i = 0; i < localStorage.length; i++) {
        const keyValue = localStorage.key(i);

        if (keyValue) {
          const bufferString = localStorage.getItem(keyValue);

          if (bufferString) {
            const buffer = JSON.parse(bufferString);

            if (buffer.id === value.id) {
              localStorage.removeItem(keyValue);
              break;
            }
          }
        }
      }
    }

  }

  ShareTT(name:any, url:any) {
    window.open("https://twitter.com/intent/tweet?text="+"Check "+name+" on Ticketmaster."+"&url="+url, '_blank');
  }

  ShareFB(url:any) {
    window.open("http://www.facebook.com/sharer/sharer.php?u="+url, '_blank');
  }

  toggleContent(section: keyof typeof DetailsComponent.prototype.showFullContent) {
    this.showFullContent[section] = !this.showFullContent[section];
  }

  openSpotify(link: any) {
    window.open(link, '_blank');
  }

  setArtistDataAttr(value: unknown, property: keyof artistData): string | undefined {
    if (typeof value === 'object' && value !== null) {
      return (value as artistData)[property];
    }
    return undefined;
  }

  isEmptyObject(obj: any): boolean {
    return Object.keys(obj).length === 0;
  }

  HaveData(obj: any): boolean {
    return Object.keys(obj).length !== 0;
  }

  isMultiObject(obj: any): boolean {
    return Object.keys(obj).length > 1;
  }

  onBackButtonClick() {
    this.goBackEvent.emit(false);
  }

  checkIfIdExists(id: string): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const keyValue = localStorage.key(i);
  
      if (keyValue) {
        const bufferString = localStorage.getItem(keyValue);
  
        if (bufferString) {
          const buffer = JSON.parse(bufferString);
  
          if (buffer.id === id) {
            this.isFavorite = true;
            return true;
          }
        }
      }
    }
    this.isFavorite = false;
    return false;
  }

  getNextLocalStorageKey(): string {
    let nextKey = 0;
    while (localStorage.getItem(String(nextKey)) !== null) {
      nextKey++;
    }
    return String(nextKey);
  }

  onTabChanged(event: MatTabChangeEvent) {
    console.log("clicked!!!")
    this.selectedTabIndex = event.index;

    const non_active = this.el.nativeElement.querySelectorAll('mat-mdc-focus-indicator');
    console.log(non_active)
    if (non_active) {
      non_active.forEach((element: HTMLElement) => {
        this.renderer.setStyle(element, 'color', 'grey');
        // set other styles here
      });
    }


    const active = this.el.nativeElement.querySelector('.mdc-tab--active .mdc-tab__text-label');
    console.log(active)
    if (active) {
      this.renderer.setStyle(active, 'color', 'red!important');
    }
  }


}
