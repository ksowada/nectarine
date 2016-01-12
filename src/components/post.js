import { h, Component } from 'preact';
import parseMessageText from 'parse-message';
import { bind } from 'decko';
import { emit } from '../pubsub';

const EMPTY = {};


const RENDERERS = {
	image: props => (<ImageViewer {...props} />),

	gif: props => (<ImageViewer {...props} />),

	video: props => (<VideoPlayer {...props} />),

	text: ({ text }) => (<p>{ parseMessageText(text) || ' ' }</p>),

	link: ({ title, description, url, imageURL }) => (
		<div class="item-link">
			<a href={url} target="_blank">{ title }</a>
			<p>{ description }</p>
			<img src={imageURL} />
		</div>
	),

	music: props => (<MusicPlayer {...props} />),

	location: ({ name, iconSrc, lat, long }) => (
		<a href={`http://maps.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(long)}`} target="_blank" style="display:block;">
			{ iconSrc ? <img src={iconSrc} width="26" height="26" style="float:left; background:#CCC; border-radius:50%;" /> : null }
			<div style="overflow:hidden; padding:5px;">{ name }</div>
		</a>
	)
};


export default class Post extends Component {
	// shouldComponentUpdate({ id }) {
	// 	return id!==this.props.id;
	// }

	@bind
	goAuthor() {
		let { author, body } = this.props,
			id = (author && author.id) || (body && body.authorStream && body.authorStream.id);
		if (id) {
			emit('go', { url:`/profile/${encodeURIComponent(id)}` });
		}
	}

	@bind
	renderItem(item) {
		let fn = RENDERERS[String(item.type).toLowerCase()];
		if (!fn) {
			console.warn(`Unknown type: ${item.type}`, item);
			return null;
		}
		return <div class={'item item-'+item.type}>{ fn(item) }</div>;
	}

	render({ type, body, message, createdTime }) {
		let author = body && body.authorStream,
			avatar = author && author.avatarSrc;
		if (!message || !message[0] && body) {
			message = [{ type:'text', text:body.message }];
		}
		return (
			<div class={'post type-'+type}>
				{ author ? (
					<div class="avatar" onClick={this.goAuthor} style={`background-image: url(${avatar});`} />
				) : null }
				<div class="items">{
					message.map(this.renderItem)
				}</div>
			</div>
		);
	}
}


class ImageViewer extends Component {
	// @bind
	// toggle(e) {
	// 	this.setState({ full: !this.state.full });
	// 	if (e) return e.preventDefault(), e.stopPropagation(), false;
	// }

	render({ src }, { full }) {
		return <img src={src} style={{
			display: 'block',
			maxWidth: full?'auto':'',
			margin: 'auto'
		}} onClick={this.toggle} />;
	}
}


class VideoPlayer extends Component {
	@bind
	play() {
		this.setState({ play:true });
	}

	@bind
	stop() {
		this.setState({ play:false });
	}

	componentDidUpdate() {
		if (this.state.play) {
			setTimeout(() => this.querySelector('video').play(), 100);
		}
	}

	render({ src, poster }, { play }) {
		return (
			<div class="video-player">
				{ play ? (
					<video src={src} onPause={this.stop} autoplay autobuffer autostart />
				) : (
					<img src={poster} onClick={this.play} />
				) }
			</div>
		);
	}
}


class MusicPlayer extends Component {
	render({ title, spotifyData={} }) {
		let id = spotifyData && spotifyData.track && spotifyData.track.id,
			url = `https://embed.spotify.com/?uri=spotify:track:${encodeURIComponent(id)}`;
		return (
			<div class="music-player">
				<h6>{ title }</h6>
				{ id ? (
					<iframe src={url} frameborder="0" allowtransparency="true" style="width:100%; height:380px;" />
				) : null }
			</div>
		);
	}
}