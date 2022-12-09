import {Component, Input, ViewChild} from '@angular/core';
import {File} from '../../../model/client-data';
import {MatTable} from '@angular/material/table';

@Component({
  selector: 'app-client-files',
  template: `
    <table mat-table [dataSource]="files" >

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef> File ID </th>
        <td mat-cell *matCellDef="let element"> {{element.fileId}} </td>
      </ng-container>

      <ng-container matColumnDef="weight">
        <th mat-header-cell *matHeaderCellDef> Weight </th>
        <td mat-cell *matCellDef="let element"> {{element.weight}} </td>
      </ng-container>


      <ng-container matColumnDef="sent">
        <th mat-header-cell *matHeaderCellDef> Send</th>
        <td mat-cell *matCellDef="let element"> {{calcSendPercent(element.weight, element.sent)}}% </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `,
  styleUrls: ['./client-files.component.scss']
})
export class ClientFilesComponent   {
  @ViewChild(MatTable) table: MatTable<any>;
  @Input() files: File[];

  constructor() { }
  displayedColumns: string[] = ['name',  'weight',  'sent'];
  dataSource= [];
  delete(row: any): void {
    /* delete logic here */
    this.table.renderRows();
  }
  calcSendPercent(weight: number, sent: number): number {
    return Math.round(sent / weight * 100);
  }
}
