class SystemTest {

  constructor(config) {

  }

  testBrowser() {
    for(let feature in Modernizr){
      if(Modernizr.hasOwnProperty(feature)){
        if(!feature){
          return false;
        }
      }
    }
    return true;
  }
}
