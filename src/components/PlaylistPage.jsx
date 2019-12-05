import React, { useContext } from "react";
import ReactPlayer from "react-player";
import "./PlaylistPage.scss";
import fileUtils from "../utils/file-util";
import { Store } from "../Store.js";

import * as mm from "music-metadata-browser";
import PlaylistInputRow from "./PlaylistInputRow";
import PlaylistMenuView from "./PlaylistMenuView";
import PlaylistContentView from "./PlaylistContentView";

const PlaylistPage = () => {
  const globalState = useContext(Store);
  const { state, dispatch } = globalState;

  const dispatchNextTrack = url => {
    dispatch({
      type: "NEXT_TRACK"
    });
  };

  const dispatchAddTracksToCurrentPlaylist = tracks => {
    dispatch({
      type: "ADD_TRACKS_TO_CURRENT_PLAYLIST",
      payload: tracks
    });
  };

  const dispatchNewPlaylist = tracks => {
    dispatch({
      type: "NEW_PLAYLIST",
      payload: tracks
    });
  };

  const dispatchLoadPlaylist = playlist => {
    dispatch({
      type: "LOAD_PLAYLIST",
      payload: playlist
    });
  };

  const newPlaylistClick = async () => {
    const newUrls = await fileUtils.openAudioFiles();
    if (newUrls.length > 0) {
      const promises = newUrls.map(url =>
        mm.fetchFromUrl(url).then(metadata => ({
          url: url,
          title: metadata.common.title,
          album: metadata.common.album,
          artist: metadata.common.artist
        }))
      );

      Promise.all(promises).then(tracks => {
        dispatchNewPlaylist(tracks);
      });
    }
  };

  const addToPlaylistClick = async () => {
    if (state.currentPlaylist.name === "") {
      return;
    }

    const newTracks = await fileUtils.openAudioFiles();

    const promises = newTracks.map(url =>
      mm.fetchFromUrl(url).then(metadata => ({
        url: url,
        title: metadata.common.title,
        album: metadata.common.album,
        artist: metadata.common.artist
      }))
    );

    Promise.all(promises).then(tracks => {
      const newTracks = [...state.currentPlaylist.tracks, ...tracks].reduce(
        (unique, item) => {
          return unique.filter(u => u.url === item.url).length > 0
            ? unique
            : [...unique, item];
        },
        []
      );
      if (newTracks.length !== state.currentPlaylist.tracks.length) {
        dispatchAddTracksToCurrentPlaylist(newTracks);
      }
    });
  };

  const openPlaylist = async () => {
    const newPlaylist = await fileUtils.loadPlaylist();
    if (newPlaylist.name !== "" && newPlaylist.urls.length > 0) {
      const promises = newPlaylist.urls.map(url =>
        mm.fetchFromUrl(url).then(metadata => ({
          url: url,
          title: metadata.common.title,
          album: metadata.common.album,
          artist: metadata.common.artist
        }))
      );

      Promise.all(promises).then(tracks => {
        dispatchLoadPlaylist({
          name: newPlaylist.name,
          tracks: tracks,
          saved: true
        });
      });
    }
  };

  const savePlaylist = async () => {
    if (state.currentPlaylist.tracks.length > 0) {
      const newPlaylist = await fileUtils.savePlaylist({
        name: state.currentPlaylist.name,
        urls: state.currentPlaylist.tracks.map(track => track.url)
      });

      if (newPlaylist.name !== "" && newPlaylist.urls.length > 0) {
        const promises = newPlaylist.urls.map(url =>
          mm.fetchFromUrl(url).then(metadata => ({
            url: url,
            title: metadata.common.title,
            album: metadata.common.album,
            artist: metadata.common.artist
          }))
        );

        Promise.all(promises).then(tracks => {
          dispatchLoadPlaylist({
            name: newPlaylist.name,
            previousName: newPlaylist.previousName,
            tracks: tracks,
            saved: true
          });
        });
      }
    }
  };

  return (
    <div className="playlist-page">
      <div className="playlist-wrapper">
        <PlaylistInputRow
          newPlaylistClick={newPlaylistClick}
          addToPlaylistClick={addToPlaylistClick}
          openPlaylist={openPlaylist}
          savePlaylist={savePlaylist}
        />
        <div className="playlist-contents-wrapper">
          <div className="playlist-menu-wrapper size-1-4">
            <PlaylistMenuView />
          </div>
          <div className="playlist-content-wrapper size-3-4">
            <PlaylistContentView />
          </div>
        </div>
      </div>

      <div className="player-wrapper">
        <ReactPlayer
          className="react-player"
          config={{
            file: {
              forceAudio: true
            }
          }}
          onEnded={dispatchNextTrack}
          controls
          playing={state.isPlaying}
          loop={state.isTrackLooping}
          volume={state.volume}
          url={state.currentTrackUrl}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
};

export default PlaylistPage;