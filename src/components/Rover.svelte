<script>
  import Tiles from '../assets';
  import { getRoverDirection } from '../logic/roverDetails';
  export let title;
  export let row;
  export let col;
  // orientation represented by degrees of where the rover is facing
  export let orientation;
</script>

<div class="absolute top-0">
  <img
    style="{`transform: rotate(${orientation}deg)`}"
    class="{`ml-3 mt-3`}"
    src="{Tiles.rover}"
    title="{`${title}-${row}-${col}-${getRoverDirection(orientation)}`}"
    alt="rover"
  />
</div>
