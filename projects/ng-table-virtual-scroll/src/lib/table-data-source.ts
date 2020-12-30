import { DataSource } from '@angular/cdk/table';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  Subscription,
} from 'rxjs';

export class TableVirtualScrollDataSource<T> extends DataSource<T> {
  /** Stream that emits when a new data array is set on the data source. */
  private readonly _data: BehaviorSubject<T[]>;

  /** Stream emitting render data to the table (depends on ordered data changes). */
  private readonly _renderData = new BehaviorSubject<T[]>([]);

  /**
   * Subscription to the changes that should trigger an update to the table's rendered rows, such
   * as filtering, sorting, pagination, or base data changes.
   */
  protected _renderChangesSubscription: Subscription | null = null;

  public dataToRender$: Subject<T[]>;
  public dataOfRange$: Subject<T[]>;
  protected streamsReady: boolean;

  /** Array of data that should be rendered by the table, where each object represents one row. */
  get data() {
    return this._data.value;
  }
  set data(data: T[]) {
    this._data.next(data);
  }

  constructor(initialData: T[] = []) {
    super();
    this._data = new BehaviorSubject<T[]>(initialData);
    this.updateChangeSubscription();
  }

  protected updateChangeSubscription() {
    this.initStreams();
    this._renderChangesSubscription = new Subscription();
    this._renderChangesSubscription.add(
      this._data.subscribe((data) => this.dataToRender$.next(data))
    );
    this._renderChangesSubscription.add(
      this.dataOfRange$.subscribe((data) => this._renderData.next(data))
    );
  }

  protected initStreams() {
    if (!this.streamsReady) {
      this.dataToRender$ = new ReplaySubject<T[]>(1);
      this.dataOfRange$ = new ReplaySubject<T[]>(1);
      this.streamsReady = true;
    }
  }

  /**
   * Used by the MatTable. Called when it connects to the data source.
   * @private
   */
  connect(): Observable<T[] | readonly T[]> {
    if (!this._renderChangesSubscription) {
      this.updateChangeSubscription();
    }

    return this._renderData;
  }

  /**
   * Used by the MatTable. Called when it disconnects from the data source.
   * @private
   */
  disconnect() {
    if (this._renderChangesSubscription) {
      this._renderChangesSubscription.unsubscribe();
    }
    this._renderChangesSubscription = null;
  }
}
