import Vue from 'vue';

let EventService = new Vue({
  data:{
    Brushed: 'on_brushed',
    Selected: 'on_selected',
  },

  methods:{
    emitBrushed: function(msg){
      this.$emit(this.Brushed, msg);
    },
    onBrushed: function(callback){
      this.$on(this.Brushed, function(msg){
        callback(msg);
      })
    },

    emitSelected: function(arg1, arg2){
      this.$emit(this.Selected, arg1, arg2);
    },
    onSelected: function (callback) {
      this.$on(this.Selected, function(arg1, arg2){
        callback(arg1, arg2);
      })
    },
  }
});

export default EventService;
