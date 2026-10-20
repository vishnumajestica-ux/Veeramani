# Veeramani Tank Jump

A self-contained HTML/CSS/JavaScript endless-runner game for practicing deployment on AWS EC2 with Apache.

## Files
- `index.html` — game layout
- `style.css` — visual design and responsive layout
- `script.js` — jumping, tank spawning, collision detection, score, 3 lives, best score, optional sound
- `images/veeramani.png` — cropped transparent hero image created from the photo you provided
- `images/original-photo.jpg` — copy of the original photo for reference

## Run locally
Open `index.html` in a browser. No build step is needed. The optional Google Font falls back to system fonts if offline.

## Deploy to Amazon Linux with Apache
1. Copy the `veeramani-tank-jump` folder to your EC2 instance.
2. Copy its contents into Apache's document root:
   `sudo cp -r veeramani-tank-jump/* /var/www/html/`
3. Set permissions:
   `sudo chown -R apache:apache /var/www/html`
   `sudo find /var/www/html -type d -exec chmod 755 {} \;`
   `sudo find /var/www/html -type f -exec chmod 644 {} \;`
4. Make sure the EC2 security group allows inbound TCP port 80.
5. Visit `http://YOUR_EC2_PUBLIC_IP/`

On Ubuntu, use `www-data:www-data` instead of `apache:apache` if you need to set ownership.

## Controls
- Space / Up arrow / W / tap: jump
- P: pause
- R: restart
- Three lives; collision removes one life.
