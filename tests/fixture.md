# remark-link-card-plus

## Bare links

Bare links are converted to link cards.

http://example.com/

https://www.npmjs.com/package/remark-link-card-plus

<http://example.com/>

<https://www.npmjs.com/package/remark-link-card-plus>

## Inline links

Inline links are **not** converted to link cards.

[example](http://example.com/) is inline link

[remark-link-card-plus](https://www.npmjs.com/package/remark-link-card-plus) is inline link

## Multiple links in one line

If there are multiple links in one line, they will **not** be converted to link cards.

http://example.com/ http://example.com/ http://example.com/

## Invalid links

http://localhost:3000/rlc-simple/sample

## Links where ogs fails

https://codepen.io/gladevise/pen/VwmEvoo
