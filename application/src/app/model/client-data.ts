
export enum NodeStatus{
  WAITING,  PROCESSING_FILE
}

export enum  ClientStatus {
  WAITING, SENDING_FILE
}

export interface ClientData {
  clientId: string;
  files: File[];
  waitingFrom: Date;
  status: ClientStatus
  score: number;
  nodeId?: string;
}

export interface File {
  fileId: string;
  weight: number;
  sent: number;
}

export interface Node {
  nodeId: string;
  status: NodeStatus;
  fileId?: string;
  clientId?: string;
}
