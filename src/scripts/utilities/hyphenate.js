function hyphenate(string) {
  if (string.includes(' ')) {
    let newString = string.replace(' ', '-');
    newString = newString.replace(',','');
    return hyphenate(newString);
  } else {
    return string;
  }
}