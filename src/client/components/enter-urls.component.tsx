import { IRetrievalError, RetrievalState } from '@mixer/retrieval';
import * as React from 'react';
import GithubCorner from 'react-github-corner';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { clearLoadedBundles, loadAllUrls } from '../redux/actions';
import {
  BundleStateMap,
  getBundleErrors,
  getBundleUrls,
  getGroupedBundleState,
  IAppState,
} from '../redux/reducer';
import { Button } from './button.component';
import * as styles from './enter-urls.component.scss';
import { Errors } from './errors.component';
import { ProgressBar } from './progress-bar.component';

interface IProps {
  defaultUrls: string[];
  bundleStates: BundleStateMap;
  bundleErrors: IRetrievalError[];
  load(urls: string[]): void;
  complete(): void;
  cancel(): void;
}

interface IState {
  urls: string;
}

class EnterUrlsComponent extends React.PureComponent<IProps, IState> {
  public state = { urls: this.props.defaultUrls.join('\n') };

  public componentDidMount() {
    this.props.cancel();
  }

  public render() {
    const retrievingCount = this.props.bundleStates[RetrievalState.Retrieving];
    const progress = 1 - retrievingCount / this.props.defaultUrls.length;

    let contents: React.ReactNode;
    if (retrievingCount) {
      contents = (
        <>
          <small>Downloading and parsing bundles...</small>
          <ProgressBar progress={progress} />
          <Button onClick={this.props.cancel}>Cancel</Button>
        </>
      );
    } else if (
      this.props.defaultUrls.length > 0 &&
      this.props.bundleStates[RetrievalState.Succeeded] === this.props.defaultUrls.length
    ) {
      contents = (
        <>
          <small>Opening the dashboard...</small>
          <ProgressBar progress={1} />
          <Redirect to="/dashboard" push={true} />
        </>
      );
    } else {
      contents = (
        <>
          <small>Enter line-separated URLs of bundle JSON or msgpack files to compare</small>
          {this.props.bundleErrors.length ? (
            <Errors className={styles.error} errors={this.props.bundleErrors} />
          ) : null}
          <textarea
            spellCheck={false}
            wrap="off"
            value={this.state.urls}
            onChange={this.onChange}
          />
          <Button onClick={this.load} disabled={!this.state.urls.trim()}>
            Load
          </Button>
        </>
      );
    }

    return (
      <>
        <GithubCorner href="https://github.com/mixer/webpack-bundle-compare" />
        <div className={styles.entry}>
          <h1>Webpack Bundle Comparsion</h1>
          {contents}
        </div>
      </>
    );
  }

  private readonly load = () => {
    this.props.load(
      this.state.urls
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean),
    );
  };

  private readonly onChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ urls: evt.target.value });
  };
}

export const EnterUrls = connect(
  (state: IAppState) => ({
    defaultUrls: getBundleUrls(state),
    bundleErrors: getBundleErrors(state),
    bundleStates: getGroupedBundleState(state),
  }),
  dispatch => ({
    load(urls: string[]) {
      dispatch(loadAllUrls({ urls }));
    },
    cancel() {
      dispatch(clearLoadedBundles());
    },
  }),
)(EnterUrlsComponent);
