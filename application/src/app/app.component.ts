import {Component, OnInit} from '@angular/core';
import {ClientData, ClientStatus, File, Node, NodeStatus} from './model/client-data';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {interval, Subject, Subscription} from 'rxjs';

// Returns a random number between the specified values.
// The returned value is no lower than (and may possibly equal) min, and is less than (and not equal) max.
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// Calculating total score for given file
function calcScore(file: File, waitingFrom: Date, clientsCount: number): number{
  const now = new Date();
  return calcWeightScore(file.weight) / clientsCount + calcTimeScore(now.getTime() - waitingFrom.getTime()) * clientsCount;
}

// Calculating weight score for given file
function calcWeightScore(weight: number): number{
  return Math.pow(weight, 2);
}

// Calculating time score for given file
function calcTimeScore(seconds: number): number{
  return 1 / (Math.pow(seconds, 2));
}

// Main Page lookout
@Component({
  selector: 'app-root',
  template: `
    <div class="time_header">
      <div class="timer">Current time (hh:mm:ss): {{time}}</div>
    </div>
    <div class="content">
      <div class="main_buttons">
        <mat-button-toggle-group (change)="startToggleChanged($event)" name="fontStyle" aria-label="Font Style">
          <mat-button-toggle value="start">Start</mat-button-toggle>
          <mat-button-toggle value="stop">Stop</mat-button-toggle>
        </mat-button-toggle-group>
      </div>
      <div class="other_buttons">
        <button mat-raised-button (click)="clear()">Clear</button>
        <button mat-raised-button (click)="init()">Init</button>
        <button mat-raised-button (click)="addClient()">Add client</button>
      </div>
    </div>
    <div class="main-wrapper">
      <app-server-view style="margin-bottom: 50px" [nodes]="nodes" [files]="getAllFiles()"></app-server-view>
      <app-clients-view [clients]="clients" (remove)="removeClient($event)"></app-clients-view>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {
  clients: ClientData[] = [];
  startToggle: 'start';
  sourceRaw$ = interval(1);
  toggleState: string = 'stop;'
  source$ = new Subject<number>();
  time: string = '00.00.00'

  fileID: number = 0;
  nodes: Node[];
  private currentSubscription: Subscription = new Subscription();
  // Max files number per one klient
  maxFiles: any = 6;
  // Clients number
  clientsCount: number = rand(5, 8);

  getAllFiles(): File[]{
    const allFiles: File[] = [];
    this.clients.forEach(client => allFiles.push(... client.files));
    return allFiles;
  }

  ngOnInit(): void {
    this.source$.subscribe(val => {

      // Initialize current time
      var today = new Date();
      this.time =
        today.getHours() + ":" + (((today.getMinutes()).valueOf() < 10) ? '0' + today.getMinutes().toString() : today.getMinutes()).toString() + ":" + today.getSeconds();

      // Client initialization on Main Page
      // Acquiring: waiting status or node number
      // Removing sent file
      this.clients.filter(client => client.status === ClientStatus.SENDING_FILE)
        .forEach(client => {
          client.files[0].sent += 1;

          // If sent change status to WAITING, reset waiting time and remove file from table in code
          if (client.files[0].sent >= client.files[0].weight){
            client.waitingFrom = new Date();
            client.status = ClientStatus.WAITING;

            const clientNode = this.nodes.find(node => node.nodeId === client.nodeId)
            if (clientNode) {
              clientNode.status = NodeStatus.WAITING;
            }

          client.files.shift();

           if (client.files.length === 0){
               this.clients.splice(this.clients.findIndex(el => el.clientId === client.clientId), 1);
            }
          }
        });

        // Node initialization
        this.nodes.forEach(node => {
            if (node.status === NodeStatus.PROCESSING_FILE) {
            // If node is not receiving file
              if(!this.clients.find(client => client.clientId === node.clientId)){
                node.status = NodeStatus.WAITING;
              }
            }

            // If Node can is able to receive a file, find a list of proper clients and check the scores of their files
            if (node.status === NodeStatus.WAITING && this.clients.length > 0) {
              const clientsNumber: number = this.clients.length
              const client:ClientData = this.clients
                .filter(client => client.status === ClientStatus.WAITING)
                .filter(client => client.files.length > 0)
                .reduce(function(prev, curr) {
                  return (calcScore(prev.files[0], prev.waitingFrom, clientsNumber) < calcScore(curr.files[0], curr.waitingFrom, clientsNumber))
                      ? prev : curr;
                });

              // If such client exists set proper information in Client panel and get data
              if(client){
                client.waitingFrom = new Date();
                client.nodeId = node.nodeId;
                client.status = ClientStatus.SENDING_FILE;
                node.fileId = client.files[0].fileId;
                node.clientId = client.clientId;
                node.status = NodeStatus.PROCESSING_FILE;
              }
            }
          }
      )
    });

    // Start button
    this.currentSubscription.unsubscribe();
    this.currentSubscription = this.sourceRaw$.subscribe(value => {
      if (this.toggleState === 'start') {
        this.source$.next(value);
      }
    });
  }

  // Clear button
  clear() {
    this.clients = [];
  }

  // Init button
  init() {
    this.nodes = [
      {
        nodeId: "1",
        status: NodeStatus.WAITING
      },
      {
        nodeId: "2",
        status: NodeStatus.WAITING
      },
      {
        nodeId: '3',
        status: NodeStatus.WAITING
      },
      {
        nodeId: "4",
        status: NodeStatus.WAITING
      },
      {
        nodeId: "5",
        status: NodeStatus.WAITING
      }
    ];
    this.clients = [];
    const now = new Date();

    // Initialize clients content - minimum files = 3
    for (let i = 0; i < this.clientsCount; i++) {
      const filesCount = rand(3, this.maxFiles);
      // Set initial data for client
      let newClient: ClientData = {
        clientId: i.toString(),
        files: [],
        waitingFrom: now,
        status: ClientStatus.WAITING,
        score: 0,
      };

      // Set random data for each file
      for (let j = 0; j < filesCount; j++, this.fileID++) {
        newClient.files.push(
          {
            fileId: this.fileID.toString(),
            weight: this.randomWeight(),
            sent: 0,
          })
      }

      // Sort files
      newClient.files.sort(this.compare);
      this.clients.push(newClient);
    }
  }

  startToggleChanged($event: MatButtonToggleChange) {
    this.toggleState = $event.value;
  }

  // Random Weight generator
  private randomWeight(): number {
    switch (rand(0, 2)) {
      case 0:
        return rand(10, 1000)
      case 1:
        return rand(100, 10000)
      case 2:
        return rand(10000, 100000)
    }
    return rand(100000, 1000000)
  }

  // compare files weight
  compare( a:File, b:File ) {
    if ( a.weight < b.weight ){
      return -1;
    }
    if ( a.weight > b.weight ){
      return 1;
    }
    return 0;
  }

  // Remove cliet, works only if there is no file with SENDING status
  removeClient($event: any) {
    this.clients.splice(this.clients.findIndex(client => client.clientId === $event), 1);
  }

  // Add new Client with random data
  addClient() {
    const newclientId = this.clients.length
      const filesCount = rand(3, this.maxFiles);
      const now = new Date();
      let newClient: ClientData = {
        clientId: newclientId.toString(),
        files: [],
        waitingFrom: now,
        status: ClientStatus.WAITING,
        score: 0,
      };

      for (let j = 0; j < filesCount; j++, this.fileID++) {
        newClient.files.push(
          {
            fileId: this.fileID.toString(),
            weight: this.randomWeight(),
            sent: 0,
          })
      }

      // Sort files
      newClient.files.sort(this.compare);
      this.clients.push(newClient);
    }
  }

