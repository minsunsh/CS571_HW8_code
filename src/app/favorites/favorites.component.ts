import { Component } from '@angular/core';


// export interface JsonData {
//   id: string; 
//   date: string; 
//   time: string;
//   icon: string;
//   event: string;
//   genre: string;
//   venue: string;
//   music: string;
// }


@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})

export class FavoritesComponent {

  get getStoredData(): any[] {
      let localStorageData: any[] = [];
      const localStorageLength = localStorage.length;


      for (let i = 0; i < localStorageLength; i++) {
        const keyValue = localStorage.key(i);
        console.log("before push:::", localStorageData)

        if (keyValue) {
           const bufferString = localStorage.getItem(keyValue);

          if (bufferString) {
            const buffer = JSON.parse(bufferString);
            buffer.key = keyValue;

            // Insert the buffer object into the array based on the numeric value of the key
            localStorageData[parseInt(keyValue)] = buffer;
          }
        }
      }
      localStorageData = localStorageData.filter(item => item !== undefined);
      console.log("local storage::", localStorage)
      console.log("array variable::", localStorageData)
      return localStorageData;

      // for (let i = 0; i < localStorageLength; i++) {
      //   const keyValue = String(i);
      //   var buffer = localStorage.getItem(String(i))
      //   buffer.key = keyValue

      //   const itemData = JSON.parse(localStorage.getItem(String(i)) || '{}');
        
        
      // }
      // console.log("local storage::", localStorage)
      // console.log("array variable::", localStorageData)
      // return localStorageData;
  }

  constructor() { }
  
  delete(key: number) {
    alert("Event Removed from Favorites!")
    localStorage.removeItem(String(key));
  }

  isFavoritesEmpty(){
    if (localStorage.length == 0){
      return true;
    }
    else
      return false;
  }

  isFavorites(){
    if (localStorage.length > 0){
      return true;
    }
    else
      return false;
  }
}
