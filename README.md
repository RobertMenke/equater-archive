## THIS PROJECT HAS BEEN DISCONTINUED

## About
Equater was an iOS and Android app that let users set up agreements to split recurring bills automatically.

Equater helped users link an account with Plaid, choose a merchant they split bills with, and then would settle up automatically when it detected a transaction matching that merchant.

Equater was dissolved because it was determined that it was too easy for scammers to take advantage of their banking institutions. Scammers could simply tell their bank they didn't authorize a given charge and their bank would issue a return code that Equater was liable for no questions asked. This was not only incredibly financially burdensome, but required tremendous amounts of time and effort to attempt to resolve.

This repository is now made public for posterity so that anyone interested in the project or its technology might derive some benefit from the work that was done.

## Showcase
<div style="display:inline-block;">
  <img src="https://user-images.githubusercontent.com/13398229/204695356-20835b29-6414-4dca-b088-6eb0e57575d2.jpg" width="200" height="433">
  <img src="https://user-images.githubusercontent.com/13398229/204695414-14e0aeae-ce26-494b-a63f-b878cbd1dbdb.PNG" width=200" height="433">
  <img src="https://user-images.githubusercontent.com/13398229/204695442-dbbda64b-7e96-4d77-9852-6da923a98841.jpeg" width="200" height="433">
  <img src="https://user-images.githubusercontent.com/13398229/204695470-2c0f65f4-22af-48cb-92b5-2fd1073a48b4.jpeg" width="200" height="433">
  <img src="https://user-images.githubusercontent.com/13398229/204695577-83b6efa0-aa96-43f9-abfd-3d7e88e35ff4.PNG" width="200" height="433">
  <img src="https://user-images.githubusercontent.com/13398229/204695600-300b32ca-0efd-4f58-8339-cd1e9725dda1.PNG" width="200" height="433">
  <img src="https://user-images.githubusercontent.com/13398229/204695620-98dfafd0-58f4-4a53-9287-85e50373072a.PNG" width="200" height="433">
</div>

## Tech Stack

Server:
- NestJS/Typescript

Database:
- MySQL
- Redis

Web:
- NextJS/Typescript

iOS:
- SwiftUI

Android:
- Kotlin/Jetpack Compose

## Installation
#### Pre-requisites

- Docker
- Ngrok
- Xcode
- Android Studio
- Terraform
- Heroku CLI (todo: add to bootstrap)
- Tmux/Tmuxinator (todo: add to bootstrap)

#### Steps

1. Bootstrap tools & install packages
```bash
make bootstrap
```

2. Create a tmuxinator file
```bash
tmuxinator new equater
````
Copy the contents of tmuxinator.example.yml into your new tmuxinator file

3. Run the app
```bash
tmuxinator start equater
````
