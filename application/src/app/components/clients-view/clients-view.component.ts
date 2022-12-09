import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ClientData} from '../../model/client-data';

@Component({
  selector: 'app-clients-view',
  template: `
    <div class="clients-scroll">
      <div class="clients-view">
        <app-client *ngFor="let client of clients" [client]="client" (remove)="removeClient($event)">

        </app-client>
      </div>
    </div>
  `,
  styleUrls: ['./clients-view.component.scss']
})
export class ClientsViewComponent implements OnInit {

  @Input() clients: ClientData[];
  @Output() remove = new EventEmitter<string>();
  constructor() { }

  ngOnInit(): void {
  }

  removeClient($event: string) {
    console.log($event);
    this.remove.emit($event);
  }
}
