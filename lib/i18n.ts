import LocalizedStrings from 'localized-strings';

let strings = new LocalizedStrings({
  en: {
    how: "How do you want your egg today?",
    boiledEgg: "Boiled egg",
    softBoiledEgg: "Soft-boiled egg",
    choice: "How to choose the egg",
    fridge: {
      egg: "Egg",
      milk: "Milk",
    }
  },
  it: {
    how: "Come vuoi il tuo uovo oggi?",
    boiledEgg: "Uovo sodo",
    softBoiledEgg: "Uovo alla coque",
    choice: "Come scegliere l'uovo",
    fridge: {
      egg: "Uovo",
      milk: "Latte",
    }
  }
}
);
strings.setLanguage('it')

console.log("HOW: " + strings.how);